const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['reminder', 'overdue', 'device_offline', 'bottle_event', 'system'],
      default: 'reminder',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email'],
      default: 'in_app',
    },
    status: {
      type: String,
      enum: ['delivered', 'read', 'failed', 'pending'],
      default: 'delivered',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    relatedPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
    relatedReminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicationReminder',
      default: null,
    },
    relatedDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
