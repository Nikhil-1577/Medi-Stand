const Device = require('../models/Device');

const authenticateDevice = async (req, res, next) => {
  const { deviceId } = req.params;
  const rawKey = req.headers['x-device-key'] || req.query.apiKey || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

  if (!deviceId) {
    return res.status(400).json({ success: false, message: 'Device ID is required in URL path' });
  }

  try {
    const device = await Device.findOne({ deviceId: deviceId.toUpperCase() });

    if (!device) {
      // In development / demo mode, auto-register unknown devices to facilitate easy testing
      if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development') {
        const newDevice = await Device.create({
          deviceId: deviceId.toUpperCase(),
          name: `MediStand Device (${deviceId.toUpperCase()})`,
          apiKey: rawKey || 'mst_default_dev_key',
          status: 'online',
          lastHeartbeat: new Date(),
        });
        req.device = newDevice;
        return next();
      }

      return res.status(404).json({
        success: false,
        message: `Device '${deviceId}' is not registered on this MediStand server.`,
      });
    }

    // Check device API key if configured
    if (device.apiKey && rawKey && device.apiKey !== rawKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device authentication key (x-device-key).',
      });
    }

    req.device = device;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Device authentication error: ${error.message}`,
    });
  }
};

module.exports = { authenticateDevice };
