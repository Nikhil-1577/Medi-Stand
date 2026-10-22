const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Device = require('../models/Device');
const MedicationSchedule = require('../models/MedicationSchedule');
const MedicationReminder = require('../models/MedicationReminder');
const MedicationEvent = require('../models/MedicationEvent');
const Notification = require('../models/Notification');
const SensorTelemetry = require('../models/SensorTelemetry');

const runSeed = async () => {
  try {
    console.log('[Seed] Clearing existing demo data...');
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Device.deleteMany({}),
      MedicationSchedule.deleteMany({}),
      MedicationReminder.deleteMany({}),
      MedicationEvent.deleteMany({}),
      Notification.deleteMany({}),
      SensorTelemetry.deleteMany({}),
    ]);

    // 1. Create Default Caregiver User
    const user = await User.create({
      name: 'Dr. Om Jagdhane',
      email: 'om.jagdhane@medistand.io',
      password: 'password123',
      role: 'admin',
      phone: '+91 98765 43210',
    });

    // 2. Create Devices
    const device1 = await Device.create({
      deviceId: 'MEDISTAND-001',
      name: 'Stand 01 - Bed 12 (Ward B)',
      apiKey: 'mst_live_key_medistand_001',
      status: 'online',
      lastHeartbeat: new Date(),
      baselineRaw: -378000,
      currentRaw: -378120,
      weightThreshold: 12000,
      firmwareVersion: '1.1.0-ESP8266',
      ipAddress: '192.168.1.105',
      wifiSSID: 'Hospital_IoT_Secured',
      isBottlePresent: true,
      lastEventAt: new Date(Date.now() - 35 * 60 * 1000),
      lastEventType: 'bottle_lifted',
    });

    const device2 = await Device.create({
      deviceId: 'MEDISTAND-002',
      name: 'Stand 02 - Room 104',
      apiKey: 'mst_live_key_medistand_002',
      status: 'offline',
      lastHeartbeat: new Date(Date.now() - 3 * 3600 * 1000), // 3 hours ago
      baselineRaw: -392000,
      currentRaw: -392000,
      weightThreshold: 12000,
      firmwareVersion: '1.0.0-ESP8266',
      ipAddress: '192.168.1.112',
      wifiSSID: 'Hospital_IoT_Secured',
      isBottlePresent: true,
    });

    const device3 = await Device.create({
      deviceId: 'MEDISTAND-003',
      name: 'Stand 03 - Room 210',
      apiKey: 'mst_live_key_medistand_003',
      status: 'online',
      lastHeartbeat: new Date(),
      baselineRaw: -365000,
      currentRaw: -365050,
      weightThreshold: 12000,
      firmwareVersion: '1.1.0-ESP8266',
      ipAddress: '192.168.1.118',
      wifiSSID: 'Hospital_IoT_Secured',
      isBottlePresent: true,
    });

    // 3. Create Patients
    const patient1 = await Patient.create({
      patientId: 'PAT-101',
      fullName: 'Ajij Shaikh',
      age: 74,
      roomBed: 'Ward B - Bed 12',
      primaryCaregiverName: 'Dr. Om Jagdhane',
      caregiverEmail: 'om.jagdhane@medistand.io',
      caregiverPhone: '+91 98765 43210',
      assignedDevice: device1._id,
      notes: 'Hypertension and Type 2 Diabetes. Monitored strictly during morning rounds.',
    });

    const patient2 = await Patient.create({
      patientId: 'PAT-102',
      fullName: 'Gaurav Mahajan',
      age: 68,
      roomBed: 'Room 104',
      primaryCaregiverName: 'Nurse Michael Scott',
      caregiverEmail: 'mscott@medistand.io',
      caregiverPhone: '+91 98765 43211',
      assignedDevice: device2._id,
      notes: 'Post-cardiac rehab. Requires medication adherence tracking.',
    });

    const patient3 = await Patient.create({
      patientId: 'PAT-103',
      fullName: 'Sneha Katal',
      age: 82,
      roomBed: 'Room 210',
      primaryCaregiverName: 'Dr. Om Jagdhane',
      caregiverEmail: 'om.jagdhane@medistand.io',
      caregiverPhone: '+91 98765 43210',
      assignedDevice: device3._id,
      notes: 'Memory care support. Bottle lift alerts essential.',
    });

    // Link devices to patients
    device1.assignedPatient = patient1._id;
    await device1.save();
    device2.assignedPatient = patient2._id;
    await device2.save();
    device3.assignedPatient = patient3._id;
    await device3.save();

    // 4. Create Medication Schedules
    const sched1 = await MedicationSchedule.create({
      patient: patient1._id,
      medicationName: 'Atorvastatin 20mg',
      dosage: '1 Tablet',
      instructions: 'Take in the morning with a full glass of water',
      scheduledTime: '08:00',
      frequency: 'daily',
      reminderLeadTimeMinutes: 15,
      gracePeriodMinutes: 45,
      assignedCaregiver: 'Dr. Om Jagdhane',
      enabled: true,
    });

    const sched2 = await MedicationSchedule.create({
      patient: patient1._id,
      medicationName: 'Metformin 500mg',
      dosage: '1 Tablet',
      instructions: 'Take after lunch',
      scheduledTime: '13:00',
      frequency: 'daily',
      reminderLeadTimeMinutes: 15,
      gracePeriodMinutes: 45,
      assignedCaregiver: 'Dr. Om Jagdhane',
      enabled: true,
    });

    const sched3 = await MedicationSchedule.create({
      patient: patient1._id,
      medicationName: 'Lisinopril 10mg',
      dosage: '1 Tablet',
      instructions: 'Evening dose for blood pressure maintenance',
      scheduledTime: '20:00',
      frequency: 'daily',
      reminderLeadTimeMinutes: 15,
      gracePeriodMinutes: 45,
      assignedCaregiver: 'Dr. Om Jagdhane',
      enabled: true,
    });

    const sched4 = await MedicationSchedule.create({
      patient: patient2._id,
      medicationName: 'Amlodipine 5mg',
      dosage: '1 Capsule',
      instructions: 'Morning cardiac support',
      scheduledTime: '09:00',
      frequency: 'daily',
      reminderLeadTimeMinutes: 15,
      gracePeriodMinutes: 45,
      assignedCaregiver: 'Nurse Michael Scott',
      enabled: true,
    });

    // 5. Create Realistic Today Reminders
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Dose 1 (Morning): Completed via bottle lift
    const morningDate = new Date();
    morningDate.setHours(8, 0, 0, 0);
    const morningEventTime = new Date(morningDate.getTime() + 12 * 60 * 1000); // 8:12 AM

    const event1 = await MedicationEvent.create({
      deviceId: 'MEDISTAND-001',
      device: device1._id,
      patient: patient1._id,
      eventType: 'bottle_lifted',
      rawValue: -396000,
      baseline: -378000,
      difference: 18000,
      source: 'esp8266',
      serverTimestamp: morningEventTime,
      classification: 'Bottle lifted during scheduled medication window (Atorvastatin 20mg)',
      notes: 'Qualifying weight delta detected. Bottle removed for 42 seconds.',
    });

    await MedicationReminder.create({
      idempotentKey: `${sched1._id}_${todayStr}_08:00`,
      schedule: sched1._id,
      patient: patient1._id,
      medicationName: 'Atorvastatin 20mg',
      dosage: '1 Tablet',
      scheduledDateStr: todayStr,
      scheduledTimeStr: '08:00',
      scheduledDateTime: morningDate,
      reminderLeadDateTime: new Date(morningDate.getTime() - 15 * 60 * 1000),
      gracePeriodEndDateTime: new Date(morningDate.getTime() + 45 * 60 * 1000),
      status: 'bottle_lifted',
      notificationSentAt: new Date(morningDate.getTime() - 15 * 60 * 1000),
      notificationStatus: 'sent',
      bottleEvent: event1._id,
      interactionDetectedAt: morningEventTime,
      assignedCaregiver: 'Dr. Om Jagdhane',
      caregiverEmail: 'om.jagdhane@medistand.io',
      notes: 'Interacted on schedule.',
    });

    // Dose 2 (Gaurav's Morning 9:00 AM): Overdue (Grace period expired)
    const overdueDate = new Date();
    overdueDate.setHours(9, 0, 0, 0);

    await MedicationReminder.create({
      idempotentKey: `${sched4._id}_${todayStr}_09:00`,
      schedule: sched4._id,
      patient: patient2._id,
      medicationName: 'Amlodipine 5mg',
      dosage: '1 Capsule',
      scheduledDateStr: todayStr,
      scheduledTimeStr: '09:00',
      scheduledDateTime: overdueDate,
      reminderLeadDateTime: new Date(overdueDate.getTime() - 15 * 60 * 1000),
      gracePeriodEndDateTime: new Date(overdueDate.getTime() + 45 * 60 * 1000),
      status: 'overdue',
      notificationSentAt: new Date(overdueDate.getTime() - 15 * 60 * 1000),
      notificationStatus: 'sent',
      overdueMarkedAt: new Date(overdueDate.getTime() + 46 * 60 * 1000),
      assignedCaregiver: 'Nurse Michael Scott',
      caregiverEmail: 'mscott@medistand.io',
      notes: 'No bottle lift detected during grace window.',
    });

    // Dose 3 (Afternoon): Active right now (reminder sent, awaiting bottle lift!)
    const activeDate = new Date();
    activeDate.setMinutes(activeDate.getMinutes() + 5);
    const activeTimeStr = activeDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    await MedicationReminder.create({
      idempotentKey: `${sched2._id}_${todayStr}_${activeTimeStr}`,
      schedule: sched2._id,
      patient: patient1._id,
      medicationName: 'Metformin 500mg',
      dosage: '1 Tablet',
      scheduledDateStr: todayStr,
      scheduledTimeStr: activeTimeStr,
      scheduledDateTime: activeDate,
      reminderLeadDateTime: new Date(activeDate.getTime() - 15 * 60 * 1000),
      gracePeriodEndDateTime: new Date(activeDate.getTime() + 45 * 60 * 1000),
      status: 'reminder_sent',
      notificationSentAt: new Date(),
      notificationStatus: 'sent',
      assignedCaregiver: 'Dr. Om Jagdhane',
      caregiverEmail: 'om.jagdhane@medistand.io',
      notes: 'Caregiver alerted. Stand waiting for bottle interaction.',
    });

    // Dose 4 (Evening): Scheduled for later
    const eveningDate = new Date();
    eveningDate.setHours(20, 0, 0, 0);

    await MedicationReminder.create({
      idempotentKey: `${sched3._id}_${todayStr}_20:00`,
      schedule: sched3._id,
      patient: patient1._id,
      medicationName: 'Lisinopril 10mg',
      dosage: '1 Tablet',
      scheduledDateStr: todayStr,
      scheduledTimeStr: '20:00',
      scheduledDateTime: eveningDate,
      reminderLeadDateTime: new Date(eveningDate.getTime() - 15 * 60 * 1000),
      gracePeriodEndDateTime: new Date(eveningDate.getTime() + 45 * 60 * 1000),
      status: 'scheduled',
      assignedCaregiver: 'Dr. Om Jagdhane',
      caregiverEmail: 'om.jagdhane@medistand.io',
    });

    // 6. Create Initial Notifications
    await Notification.create([
      {
        recipient: 'Nurse Michael Scott',
        recipientEmail: 'mscott@medistand.io',
        type: 'overdue',
        title: 'OVERDUE ALERT: Gaurav Mahajan - Amlodipine 5mg',
        message: 'Grace period expired without detecting a bottle-lift event for Amlodipine 5mg (09:00). Immediate attention advised.',
        channel: 'in_app',
        status: 'delivered',
        relatedPatient: patient2._id,
        relatedDevice: device2._id,
      },
      {
        recipient: 'Caregiver / Admin',
        type: 'device_offline',
        title: 'Device Disconnected: Stand 02 - Room 104',
        message: 'MediStand unit MEDISTAND-002 has stopped transmitting telemetry and is marked Offline.',
        channel: 'in_app',
        status: 'delivered',
        relatedDevice: device2._id,
      },
      {
        recipient: 'Dr. Om Jagdhane',
        recipientEmail: 'om.jagdhane@medistand.io',
        type: 'reminder',
        title: 'Medication Reminder: Metformin 500mg for Ajij Shaikh',
        message: `Scheduled dose (1 Tablet) is due at ${activeTimeStr}. Awaiting medicine bottle lift.`,
        channel: 'in_app',
        status: 'delivered',
        relatedPatient: patient1._id,
      },
    ]);

    // 7. Generate Telemetry Stream points for MEDISTAND-001
    const telemetryBatch = [];
    for (let i = 25; i >= 0; i--) {
      const sampleTime = new Date(Date.now() - i * 60 * 1000);
      const jitter = Math.floor(Math.random() * 400) - 200;
      telemetryBatch.push({
        deviceId: 'MEDISTAND-001',
        rawValue: -378000 + jitter,
        baseline: -378000,
        difference: Math.abs(jitter),
        isBottlePresent: true,
        isSimulated: false,
        timestamp: sampleTime,
      });
    }
    await SensorTelemetry.insertMany(telemetryBatch);

    console.log('[Seed] Database successfully populated with realistic MediStand data.');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
  }
};

if (require.main === module) {
  require('dotenv').config({ path: __dirname + '/../../.env' });
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await runSeed();
    process.exit(0);
  });
}

module.exports = { runSeed };
