const mongoose = require('mongoose');

const sensorTelemetrySchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
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
    isBottlePresent: {
      type: Boolean,
      default: true,
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically prune old telemetry points after 7 days
sensorTelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('SensorTelemetry', sensorTelemetrySchema);
