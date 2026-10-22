const Device = require('../models/Device');
const Patient = require('../models/Patient');
const MedicationSchedule = require('../models/MedicationSchedule');
const MedicationReminder = require('../models/MedicationReminder');
const { processTelemetry } = require('../services/telemetryProcessor');
const { broadcast } = require('../services/socketService');
const { sendNotification } = require('../services/notificationService');

const simulateDeviceStatus = async (req, res, next) => {
  try {
    const { deviceId, status } = req.body;
    const targetStatus = status === 'online' ? 'online' : 'offline';

    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    device.status = targetStatus;
    device.lastHeartbeat = targetStatus === 'online' ? new Date() : device.lastHeartbeat;
    device.isSimulated = true;
    await device.save();

    broadcast('device:status', {
      deviceId: device.deviceId,
      status: targetStatus,
      lastHeartbeat: device.lastHeartbeat,
      isSimulated: true,
    });

    res.json({
      success: true,
      message: `Device ${device.deviceId} status changed to ${targetStatus} (Simulated)`,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

const simulateBottleLift = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const baseline = device.baselineRaw || -378000;
    // Difference greater than threshold (e.g. 15000 count delta)
    const simulatedRaw = baseline - 18000;
    const difference = 18000;

    const result = await processTelemetry({
      deviceId: device.deviceId,
      rawValue: simulatedRaw,
      baseline,
      difference,
      eventHint: 'bottle_lifted',
      isSimulated: true,
      deviceTimestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Simulated bottle-lift event processed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const simulateBottleReturn = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const baseline = device.baselineRaw || -378000;
    // Settled right back near baseline (small normal noise)
    const simulatedRaw = baseline + 120;
    const difference = 120;

    const result = await processTelemetry({
      deviceId: device.deviceId,
      rawValue: simulatedRaw,
      baseline,
      difference,
      eventHint: 'bottle_returned',
      isSimulated: true,
      deviceTimestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Simulated bottle-returned event processed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const simulateTriggerReminder = async (req, res, next) => {
  try {
    const { patientId, medicationName } = req.body;
    let patient = null;

    if (patientId) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ isActive: true });
    }

    if (!patient) {
      return res.status(400).json({ success: false, message: 'No active patient available to trigger reminder' });
    }

    const now = new Date();
    const scheduledTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    // Create a temporary schedule if none exists
    let schedule = await MedicationSchedule.findOne({ patient: patient._id });
    if (!schedule) {
      schedule = await MedicationSchedule.create({
        patient: patient._id,
        medicationName: medicationName || 'Paracetamol 500mg',
        dosage: '1 Tablet',
        scheduledTime: scheduledTimeStr,
        frequency: 'daily',
      });
    }

    const randomSuffix = Math.floor(Math.random() * 10000);
    const reminder = await MedicationReminder.create({
      idempotentKey: `SIM_${patient._id}_${Date.now()}_${randomSuffix}`,
      schedule: schedule._id,
      patient: patient._id,
      medicationName: medicationName || schedule.medicationName,
      dosage: schedule.dosage || '1 Dose',
      scheduledDateStr: todayStr,
      scheduledTimeStr,
      scheduledDateTime: now,
      reminderLeadDateTime: now,
      gracePeriodEndDateTime: new Date(now.getTime() + 45 * 60 * 1000),
      status: 'reminder_sent',
      notificationSentAt: now,
      notificationStatus: 'sent',
      assignedCaregiver: patient.primaryCaregiverName,
      caregiverEmail: patient.caregiverEmail,
      notes: 'Triggered via Demo Simulator',
    });

    await sendNotification({
      recipient: patient.primaryCaregiverName,
      recipientEmail: patient.caregiverEmail,
      type: 'reminder',
      title: `Medication Reminder: ${reminder.medicationName} for ${patient.fullName}`,
      message: `[Simulated] Scheduled dose (${reminder.dosage}) is due now at ${scheduledTimeStr}. Awaiting medicine bottle lift.`,
      relatedPatient: patient._id,
      relatedReminder: reminder._id,
    });

    broadcast('reminder:updated', reminder);

    res.json({
      success: true,
      message: 'Simulated medication reminder triggered',
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

const simulateTriggerOverdue = async (req, res, next) => {
  try {
    const { reminderId } = req.body;
    let reminder = null;

    if (reminderId) {
      reminder = await MedicationReminder.findById(reminderId).populate('patient');
    } else {
      reminder = await MedicationReminder.findOne({ status: 'reminder_sent' }).populate('patient');
    }

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'No active reminder found in "reminder_sent" status to mark overdue',
      });
    }

    const now = new Date();
    reminder.status = 'overdue';
    reminder.overdueMarkedAt = now;
    await reminder.save();

    const patientName = reminder.patient ? reminder.patient.fullName : 'Patient';

    await sendNotification({
      recipient: reminder.assignedCaregiver || 'Caregiver',
      recipientEmail: reminder.caregiverEmail,
      type: 'overdue',
      title: `OVERDUE ALERT: ${patientName} - ${reminder.medicationName}`,
      message: `[Simulated] Grace period expired without detecting a bottle-lift event for ${reminder.medicationName}. Immediate caregiver attention advised.`,
      relatedPatient: reminder.patient ? reminder.patient._id : null,
      relatedReminder: reminder._id,
    });

    broadcast('reminder:updated', reminder);

    res.json({
      success: true,
      message: 'Reminder marked as overdue (Simulated)',
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

const resetDemoData = async (req, res, next) => {
  try {
    const seed = require('../utils/seedData');
    await seed.runSeed();
    res.json({ success: true, message: 'Demo environment reset and seeded with realistic sample data' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  simulateDeviceStatus,
  simulateBottleLift,
  simulateBottleReturn,
  simulateTriggerReminder,
  simulateTriggerOverdue,
  resetDemoData,
};
