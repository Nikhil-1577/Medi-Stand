const mongoose = require('mongoose');

const medicationReminderSchema = new mongoose.Schema(
  {
    idempotentKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'Format: scheduleId_YYYY-MM-DD_HH:mm ensures zero duplicate occurrences across scheduler ticks',
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationSchedule',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    medicationName: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      default: '',
    },
    scheduledDateStr: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    scheduledTimeStr: {
      type: String, // HH:mm
      required: true,
    },
    scheduledDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    reminderLeadDateTime: {
      type: Date,
      required: true,
    },
    gracePeriodEndDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'reminder_sent', 'bottle_lifted', 'overdue', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    notificationSentAt: {
      type: Date,
      default: null,
    },
    notificationStatus: {
      type: String,
      enum: ['none', 'pending', 'sent', 'failed'],
      default: 'none',
    },
    bottleEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationEvent',
      default: null,
    },
    interactionDetectedAt: {
      type: Date,
      default: null,
    },
    overdueMarkedAt: {
      type: Date,
      default: null,
    },
    assignedCaregiver: {
      type: String,
      default: '',
    },
    caregiverEmail: {
      type: String,
      default: '',
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

medicationReminderSchema.index({ patient: 1, scheduledDateTime: 1 });
medicationReminderSchema.index({ status: 1, gracePeriodEndDateTime: 1 });

module.exports = mongoose.model('MedicationReminder', medicationReminderSchema);
