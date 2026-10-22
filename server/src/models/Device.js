const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    apiKey: {
      type: String,
      required: true,
      default: () => 'mst_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'connecting'],
      default: 'offline',
    },
    lastHeartbeat: {
      type: Date,
      default: null,
    },
    baselineRaw: {
      type: Number,
      default: 0,
    },
    currentRaw: {
      type: Number,
      default: 0,
    },
    weightThreshold: {
      type: Number,
      default: 12000,
      description: 'Minimum raw count change required to register a bottle-lift or bottle-return event',
    },
    assignedPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
    firmwareVersion: {
      type: String,
      default: '1.0.0-ESP8266',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    wifiSSID: {
      type: String,
      default: '',
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
    isBottlePresent: {
      type: Boolean,
      default: true,
    },
    lastEventAt: {
      type: Date,
      default: null,
    },
    lastEventType: {
      type: String,
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ status: 1 });

module.exports = mongoose.model('Device', deviceSchema);
