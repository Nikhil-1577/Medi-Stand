const MedicationEvent = require('../models/MedicationEvent');

const getEvents = async (req, res, next) => {
  try {
    const { patientId, deviceId, eventType, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};

    if (patientId) query.patient = patientId;
    if (deviceId) query.deviceId = deviceId.toUpperCase();
    if (eventType) query.eventType = eventType;

    if (startDate || endDate) {
      query.serverTimestamp = {};
      if (startDate) query.serverTimestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.serverTimestamp.$lte = end;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [events, total] = await Promise.all([
      MedicationEvent.find(query)
        .populate('patient')
        .populate('device')
        .populate('reminder')
        .sort({ serverTimestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      MedicationEvent.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await MedicationEvent.findById(req.params.id)
      .populate('patient')
      .populate('device')
      .populate('reminder');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Medication event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
};
