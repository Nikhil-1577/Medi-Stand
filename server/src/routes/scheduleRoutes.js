const express = require('express');
const router = express.Router();
const {
  getSchedules,
  createSchedule,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getSchedules)
  .post(protect, createSchedule);

router.route('/:id')
  .put(protect, updateSchedule)
  .delete(protect, deleteSchedule);

router.patch('/:id/toggle', protect, toggleSchedule);

module.exports = router;
