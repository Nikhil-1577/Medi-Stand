const express = require('express');
const router = express.Router();
const {
  simulateDeviceStatus,
  simulateBottleLift,
  simulateBottleReturn,
  simulateTriggerReminder,
  simulateTriggerOverdue,
  resetDemoData,
} = require('../controllers/simulationController');

// Simulation routes are enabled in development / demo mode
router.post('/device-status', simulateDeviceStatus);
router.post('/bottle-lift', simulateBottleLift);
router.post('/bottle-return', simulateBottleReturn);
router.post('/trigger-reminder', simulateTriggerReminder);
router.post('/trigger-overdue', simulateTriggerOverdue);
router.post('/reset-data', resetDemoData);

module.exports = router;
