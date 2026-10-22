const MedicationSchedule = require('../models/MedicationSchedule');
const MedicationReminder = require('../models/MedicationReminder');
const Device = require('../models/Device');
const Patient = require('../models/Patient');
const { broadcast } = require('./socketService');
const { sendNotification } = require('./notificationService');

let intervalId = null;

/**
 * Format a Date object to YYYY-MM-DD in the specified timezone
 */
const getFormattedDateInTz = (date, timezone = 'Asia/Kolkata') => {
  const options = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(date); // YYYY-MM-DD
};

/**
 * Generate daily reminders idempotently for today and tomorrow
 */
const generateOccurrences = async () => {
  try {
    const tz = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
    const now = new Date();
    const todayStr = getFormattedDateInTz(now, tz);

    const activeSchedules = await MedicationSchedule.find({ enabled: true }).populate('patient');

    for (const sched of activeSchedules) {
      if (!sched.patient || !sched.patient.isActive) continue;

      const [hours, minutes] = sched.scheduledTime.split(':').map(Number);

      // Create scheduled Date in local timezone
      const scheduledDateTime = new Date();
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const dayOfWeek = scheduledDateTime.getDay();
      if (!sched.daysOfWeek.includes(dayOfWeek)) continue;

      const idempotentKey = `${sched._id}_${todayStr}_${sched.scheduledTime}`;

      // Check if reminder already exists
      const existing = await MedicationReminder.findOne({ idempotentKey });
      if (!existing) {
        const leadMs = (sched.reminderLeadTimeMinutes || 15) * 60 * 1000;
        const graceMs = (sched.gracePeriodMinutes || 45) * 60 * 1000;

        const reminderLeadDateTime = new Date(scheduledDateTime.getTime() - leadMs);
        const gracePeriodEndDateTime = new Date(scheduledDateTime.getTime() + graceMs);

        await MedicationReminder.create({
          idempotentKey,
          schedule: sched._id,
          patient: sched.patient._id,
          medicationName: sched.medicationName,
          dosage: sched.dosage,
          scheduledDateStr: todayStr,
          scheduledTimeStr: sched.scheduledTime,
          scheduledDateTime,
          reminderLeadDateTime,
          gracePeriodEndDateTime,
          status: 'scheduled',
          assignedCaregiver: sched.assignedCaregiver || sched.patient.primaryCaregiverName,
          caregiverEmail: sched.patient.caregiverEmail,
          notes: sched.instructions,
        });
      }
    }
  } catch (error) {
    console.error('[SchedulerService] Error generating daily occurrences:', error.message);
  }
};

/**
 * Evaluate reminder progression and monitor device connectivity
 */
const evaluateReminders = async () => {
  try {
    const now = new Date();

    // 1. Transition 'scheduled' -> 'reminder_sent' when lead time is reached
    const dueReminders = await MedicationReminder.find({
      status: 'scheduled',
      reminderLeadDateTime: { $lte: now },
    }).populate('patient');

    for (const reminder of dueReminders) {
      reminder.status = 'reminder_sent';
      reminder.notificationSentAt = now;
      reminder.notificationStatus = 'sent';
      await reminder.save();

      const patientName = reminder.patient ? reminder.patient.fullName : 'Patient';

      await sendNotification({
        recipient: reminder.assignedCaregiver || (reminder.patient && reminder.patient.primaryCaregiverName) || 'Caregiver',
        recipientEmail: reminder.caregiverEmail,
        type: 'reminder',
        title: `Medication Reminder: ${reminder.medicationName} for ${patientName}`,
        message: `Scheduled dose (${reminder.dosage}) is due at ${reminder.scheduledTimeStr}. Awaiting medicine bottle lift.`,
        relatedPatient: reminder.patient ? reminder.patient._id : null,
        relatedReminder: reminder._id,
      });

      broadcast('reminder:updated', reminder);
    }

    // 2. Transition 'reminder_sent' -> 'overdue' when grace period expires
    const overdueReminders = await MedicationReminder.find({
      status: 'reminder_sent',
      gracePeriodEndDateTime: { $lt: now },
    }).populate('patient');

    for (const reminder of overdueReminders) {
      reminder.status = 'overdue';
      reminder.overdueMarkedAt = now;
      await reminder.save();

      const patientName = reminder.patient ? reminder.patient.fullName : 'Patient';

      await sendNotification({
        recipient: reminder.assignedCaregiver || (reminder.patient && reminder.patient.primaryCaregiverName) || 'Caregiver',
        recipientEmail: reminder.caregiverEmail,
        type: 'overdue',
        title: `OVERDUE ALERT: ${patientName} - ${reminder.medicationName}`,
        message: `Grace period expired without detecting a bottle-lift event for ${reminder.medicationName} (${reminder.scheduledTimeStr}). Immediate attention advised.`,
        relatedPatient: reminder.patient ? reminder.patient._id : null,
        relatedReminder: reminder._id,
      });

      broadcast('reminder:updated', reminder);
    }

    // 3. Heartbeat watchdog for active devices (2-minute timeout)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const staleDevices = await Device.find({
      status: 'online',
      lastHeartbeat: { $lt: twoMinutesAgo },
    });

    for (const device of staleDevices) {
      device.status = 'offline';
      await device.save();

      broadcast('device:status', {
        deviceId: device.deviceId,
        status: 'offline',
        lastHeartbeat: device.lastHeartbeat,
      });

      await sendNotification({
        recipient: 'Caregiver / Admin',
        type: 'device_offline',
        title: `Device Disconnected: ${device.name}`,
        message: `MediStand unit ${device.deviceId} has not sent telemetry in over 2 minutes and is marked Offline.`,
        relatedDevice: device._id,
      });
    }
  } catch (error) {
    console.error('[SchedulerService] Error evaluating reminders:', error.message);
  }
};

const startScheduler = () => {
  if (intervalId) clearInterval(intervalId);

  // Generate today's schedule immediately on boot
  generateOccurrences();

  // Run evaluation tick every 20 seconds
  intervalId = setInterval(async () => {
    await evaluateReminders();
  }, 20000);

  // Regenerate occurrences every 30 minutes
  setInterval(async () => {
    await generateOccurrences();
  }, 30 * 60 * 1000);

  console.log('[SchedulerService] Medication scheduler and heartbeat watchdog started.');
};

const stopScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  generateOccurrences,
  evaluateReminders,
};
