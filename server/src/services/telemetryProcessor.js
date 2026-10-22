const Device = require('../models/Device');
const Patient = require('../models/Patient');
const MedicationReminder = require('../models/MedicationReminder');
const MedicationEvent = require('../models/MedicationEvent');
const SensorTelemetry = require('../models/SensorTelemetry');
const { broadcast } = require('./socketService');
const { sendNotification } = require('./notificationService');

// In-memory debounce map to prevent rapid duplicate event triggers from raw jitter
const lastEventTriggerMap = new Map();
const EVENT_DEBOUNCE_MS = 5000; // 5-second debounce for state changes

/**
 * Process inbound telemetry from physical ESP8266 or simulator
 */
const processTelemetry = async ({
  deviceId,
  rawValue,
  baseline = null,
  difference = null,
  eventHint = null,
  isSimulated = false,
  deviceTimestamp = null,
}) => {
  const normDeviceId = deviceId.toUpperCase();
  const now = new Date();

  // 1. Fetch or initialize device
  const device = await Device.findOne({ deviceId: normDeviceId });
  if (!device) {
    throw new Error(`Device ${normDeviceId} not found`);
  }

  // Calculate baseline and delta
  const effectiveBaseline = baseline !== null && baseline !== undefined ? Number(baseline) : (device.baselineRaw || Number(rawValue));
  const effectiveRaw = Number(rawValue);
  const effectiveDiff = difference !== null && difference !== undefined ? Math.abs(Number(difference)) : Math.abs(effectiveRaw - effectiveBaseline);
  const threshold = device.weightThreshold || 12000;

  // Determine bottle presence state based on sensor delta
  // A weight drop or significant raw deviation indicates bottle removal
  const isLifted = effectiveDiff > threshold;
  const newBottlePresent = !isLifted;
  const previousBottlePresent = device.isBottlePresent !== false;

  // Update device record
  device.status = 'online';
  device.lastHeartbeat = now;
  device.currentRaw = effectiveRaw;
  if (baseline !== null && baseline !== undefined) {
    device.baselineRaw = effectiveBaseline;
  }
  device.isBottlePresent = newBottlePresent;
  device.isSimulated = isSimulated;
  await device.save();

  // Save lightweight telemetry stream sample
  const telemetryRecord = await SensorTelemetry.create({
    deviceId: normDeviceId,
    rawValue: effectiveRaw,
    baseline: effectiveBaseline,
    difference: effectiveDiff,
    isBottlePresent: newBottlePresent,
    isSimulated,
    timestamp: now,
  });

  // Real-time broadcast to dashboard clients
  broadcast('telemetry:stream', {
    deviceId: normDeviceId,
    rawValue: effectiveRaw,
    baseline: effectiveBaseline,
    difference: effectiveDiff,
    threshold,
    isBottlePresent: newBottlePresent,
    status: 'online',
    timestamp: now,
    isSimulated,
  });

  // State change detection (Bottle Lifted vs Bottle Returned)
  let detectedEventType = null;
  const debounceKey = `${normDeviceId}_state`;
  const lastTriggerTime = lastEventTriggerMap.get(debounceKey) || 0;

  if (eventHint === 'bottle_lifted' || (previousBottlePresent && !newBottlePresent)) {
    detectedEventType = 'bottle_lifted';
  } else if (eventHint === 'bottle_returned' || (!previousBottlePresent && newBottlePresent)) {
    detectedEventType = 'bottle_returned';
  }

  // Handle qualifying physical interaction event
  let createdEvent = null;
  if (detectedEventType && (now.getTime() - lastTriggerTime > EVENT_DEBOUNCE_MS || eventHint)) {
    lastEventTriggerMap.set(debounceKey, now.getTime());

    device.lastEventAt = now;
    device.lastEventType = detectedEventType;
    await device.save();

    // Check if device is mapped to a patient
    const patient = device.assignedPatient ? await Patient.findById(device.assignedPatient) : null;

    let activeReminder = null;
    let classification = detectedEventType === 'bottle_lifted' ? 'Bottle lifted' : 'Bottle returned to stand';

    if (patient) {
      // Look for an active medication reminder waiting for interaction
      activeReminder = await MedicationReminder.findOne({
        patient: patient._id,
        status: { $in: ['scheduled', 'reminder_sent'] },
        reminderLeadDateTime: { $lte: now },
        gracePeriodEndDateTime: { $gte: now },
      }).sort({ scheduledDateTime: 1 });

      if (activeReminder && detectedEventType === 'bottle_lifted') {
        classification = `Bottle lifted during scheduled medication window (${activeReminder.medicationName})`;
        activeReminder.status = 'bottle_lifted';
        activeReminder.interactionDetectedAt = now;
      } else if (!activeReminder && detectedEventType === 'bottle_lifted') {
        classification = 'Bottle lifted outside scheduled medication window (Unscheduled event)';
      }
    }

    // Persist immutable audit event
    createdEvent = await MedicationEvent.create({
      deviceId: normDeviceId,
      device: device._id,
      patient: patient ? patient._id : null,
      reminder: activeReminder ? activeReminder._id : null,
      eventType: detectedEventType,
      rawValue: effectiveRaw,
      baseline: effectiveBaseline,
      difference: effectiveDiff,
      source: isSimulated ? 'simulation' : 'esp8266',
      serverTimestamp: now,
      deviceTimestamp: deviceTimestamp || now.toISOString(),
      classification,
    });

    if (activeReminder && detectedEventType === 'bottle_lifted') {
      activeReminder.bottleEvent = createdEvent._id;
      await activeReminder.save();

      // Notify caregiver of physical interaction
      await sendNotification({
        recipient: activeReminder.assignedCaregiver || patient.primaryCaregiverName || 'Assigned Caregiver',
        recipientEmail: activeReminder.caregiverEmail || patient.caregiverEmail,
        type: 'bottle_event',
        title: `Medication Interaction Detected: ${patient.fullName}`,
        message: `Medicine bottle was lifted from MediStand for ${patient.fullName} (${activeReminder.medicationName} - ${activeReminder.dosage}).`,
        relatedPatient: patient._id,
        relatedReminder: activeReminder._id,
        relatedDevice: device._id,
      });

      broadcast('reminder:updated', activeReminder);
    }

    broadcast('event:new', {
      event: createdEvent,
      patientName: patient ? patient.fullName : 'Unassigned Patient',
      deviceName: device.name,
    });
  }

  return {
    success: true,
    deviceId: normDeviceId,
    currentRaw: effectiveRaw,
    baseline: effectiveBaseline,
    difference: effectiveDiff,
    isBottlePresent: newBottlePresent,
    detectedEvent: createdEvent,
  };
};

module.exports = {
  processTelemetry,
};
