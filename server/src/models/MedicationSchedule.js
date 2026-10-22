const mongoose = require('mongoose');

const medicationScheduleSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    medicationName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      default: '1 Dose',
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
    },
    scheduledTime: {
      type: String,
      required: true,
      trim: true,
      // Format: "HH:mm" in 24-hour time
    },
    frequency: {
      type: String,
      enum: ['daily', 'custom'],
      default: 'daily',
    },
    daysOfWeek: {
      type: [Number], // 0: Sun, 1: Mon, ... 6: Sat
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    reminderLeadTimeMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 120,
    },
    gracePeriodMinutes: {
      type: Number,
      default: 45,
      min: 5,
      max: 240,
    },
    assignedCaregiver: {
      type: String,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  {
    timestamps: true,
  }
);

medicationScheduleSchema.index({ patient: 1 });
medicationScheduleSchema.index({ enabled: 1 });

module.exports = mongoose.model('MedicationSchedule', medicationScheduleSchema);
