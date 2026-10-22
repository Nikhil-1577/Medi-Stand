const mongoose = require('mongoose');

const medicationEventSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
    reminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationReminder',
      default: null,
    },
    eventType: {
      type: String,
      enum: ['bottle_lifted', 'bottle_returned', 'weight_change', 'manual_confirmation'],
      required: true,
      index: true,
    },
    rawValue: {
      type: Number,
      required: true,
    },
    baseline: {
      type: Number,
      default: 0,
    },
    difference: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ['esp8266', 'simulation', 'caregiver_manual'],
      default: 'esp8266',
    },
    serverTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deviceTimestamp: {
      type: String,
      default: '',
    },
    classification: {
      type: String,
      default: 'Bottle lifted',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

medicationEventSchema.index({ deviceId: 1, serverTimestamp: -1 });
medicationEventSchema.index({ patient: 1, serverTimestamp: -1 });

module.exports = mongoose.model('MedicationEvent', medicationEventSchema);
