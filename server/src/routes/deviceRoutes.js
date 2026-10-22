const express = require('express');
const router = express.Router();
const {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  postTelemetry,
  getTelemetryHistory,
} = require('../controllers/deviceController');
const { protect } = require('../middleware/auth');
const { authenticateDevice } = require('../middleware/deviceAuth');

// Hardware IoT Ingestion Endpoint (Authorized via per-device API key header or parameter)
router.post('/:deviceId/telemetry', authenticateDevice, postTelemetry);

// Dashboard Device Management
router.route('/')
  .get(protect, getDevices)
  .post(protect, createDevice);

router.route('/:id')
  .get(protect, getDeviceById)
  .put(protect, updateDevice);

router.get('/:deviceId/history', protect, getTelemetryHistory);

module.exports = router;
