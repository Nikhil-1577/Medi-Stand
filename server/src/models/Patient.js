const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 130,
    },
    roomBed: {
      type: String,
      default: '',
      trim: true,
    },
    primaryCaregiverName: {
      type: String,
      required: true,
      trim: true,
    },
    caregiverEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    caregiverPhone: {
      type: String,
      default: '',
      trim: true,
    },
    assignedCaregiverUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ assignedDevice: 1 });

module.exports = mongoose.model('Patient', patientSchema);
