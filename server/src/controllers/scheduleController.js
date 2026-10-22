const MedicationSchedule = require('../models/MedicationSchedule');
const Patient = require('../models/Patient');
const { generateOccurrences } = require('../services/schedulerService');

const getSchedules = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.patientId) {
      filter.patient = req.query.patientId;
    }

    const schedules = await MedicationSchedule.find(filter)
      .populate({
        path: 'patient',
        populate: { path: 'assignedDevice' },
      })
      .sort({ scheduledTime: 1 });

    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    next(error);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const {
      patient,
      medicationName,
      dosage,
      instructions,
      scheduledTime,
      frequency,
      daysOfWeek,
      reminderLeadTimeMinutes,
      gracePeriodMinutes,
      assignedCaregiver,
    } = req.body;

    if (!patient || !medicationName || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Patient, medication name, and scheduled time are required fields.',
      });
    }

    // Time validation (HH:mm)
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(scheduledTime)) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in 24-hour format (HH:mm, e.g. 08:30 or 20:00)',
      });
    }

    const schedule = await MedicationSchedule.create({
      patient,
      medicationName,
      dosage: dosage || '1 Dose',
      instructions: instructions || '',
      scheduledTime,
      frequency: frequency || 'daily',
      daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      reminderLeadTimeMinutes: Number(reminderLeadTimeMinutes) || 15,
      gracePeriodMinutes: Number(gracePeriodMinutes) || 45,
      assignedCaregiver: assignedCaregiver || '',
      enabled: true,
      timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
    });

    // Generate today's reminder occurrence immediately
    await generateOccurrences();

    const populated = await MedicationSchedule.findById(schedule._id).populate('patient');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('patient');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await generateOccurrences();
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

const toggleSchedule = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    schedule.enabled = !schedule.enabled;
    await schedule.save();

    await generateOccurrences();
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
};
