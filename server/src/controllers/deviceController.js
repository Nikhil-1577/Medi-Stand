const Device = require('../models/Device');
const SensorTelemetry = require('../models/SensorTelemetry');
const { processTelemetry } = require('../services/telemetryProcessor');

const getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().populate('assignedPatient').sort({ deviceId: 1 });
    res.json({ success: true, count: devices.length, data: devices });
  } catch (error) {
    next(error);
  }
};

const getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findOne({
      $or: [{ _id: req.params.id }, { deviceId: req.params.id.toUpperCase() }],
    }).populate('assignedPatient');

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const recentTelemetry = await SensorTelemetry.find({ deviceId: device.deviceId })
      .sort({ timestamp: -1 })
      .limit(30);

    res.json({
      success: true,
      data: {
        device,
        recentTelemetry: recentTelemetry.reverse(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createDevice = async (req, res, next) => {
  try {
    const { deviceId, name, weightThreshold, assignedPatient } = req.body;

    if (!deviceId || !name) {
      return res.status(400).json({ success: false, message: 'Device ID and Name are required' });
    }

    const normId = deviceId.toUpperCase().trim();
    const existing = await Device.findOne({ deviceId: normId });
    if (existing) {
      return res.status(400).json({ success: false, message: `Device '${normId}' already exists` });
    }

    const device = await Device.create({
      deviceId: normId,
      name,
      weightThreshold: Number(weightThreshold) || 12000,
      assignedPatient: assignedPatient || null,
      status: 'offline',
    });

    res.status(201).json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

const updateDevice = async (req, res, next) => {
  try {
    const device = await Device.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { deviceId: req.params.id.toUpperCase() }] },
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedPatient');

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    res.json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

/**
 * Authoritative Hardware Ingestion Endpoint
 * POST /api/devices/:deviceId/telemetry
 */
const postTelemetry = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { rawValue, baseline, difference, event, timestamp } = req.body;

    if (rawValue === undefined || rawValue === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: "rawValue" count is required from HX711 sensor',
      });
    }

    const result = await processTelemetry({
      deviceId,
      rawValue: Number(rawValue),
      baseline: baseline !== undefined ? Number(baseline) : null,
      difference: difference !== undefined ? Number(difference) : null,
      eventHint: event,
      isSimulated: false,
      deviceTimestamp: timestamp,
    });

    res.status(200).json({
      success: true,
      message: 'Telemetry ingested successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getTelemetryHistory = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit || '50', 10);

    const telemetry = await SensorTelemetry.find({ deviceId: deviceId.toUpperCase() })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: telemetry.length,
      data: telemetry.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  postTelemetry,
  getTelemetryHistory,
};
