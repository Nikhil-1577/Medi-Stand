const express = require('express');
const router = express.Router();
const { getEvents, getEventById } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);

module.exports = router;
