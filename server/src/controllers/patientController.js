const Patient = require('../models/Patient');
const Device = require('../models/Device');
const MedicationSchedule = require('../models/MedicationSchedule');
const MedicationReminder = require('../models/MedicationReminder');

const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({ isActive: true })
      .populate('assignedDevice')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('assignedDevice');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const [schedules, recentReminders] = await Promise.all([
      MedicationSchedule.find({ patient: patient._id }),
      MedicationReminder.find({ patient: patient._id })
        .populate('bottleEvent')
        .sort({ scheduledDateTime: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        patient,
        schedules,
        recentReminders,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createPatient = async (req, res, next) => {
  try {
    const {
      patientId,
      fullName,
      age,
      roomBed,
      primaryCaregiverName,
      caregiverEmail,
      caregiverPhone,
      assignedDevice,
      notes,
    } = req.body;

    if (!patientId || !fullName || !primaryCaregiverName || !caregiverEmail) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, full name, caregiver name, and caregiver email are required fields.',
      });
    }

    const existingPatient = await Patient.findOne({ patientId: patientId.toUpperCase() });
    if (existingPatient) {
      return res.status(400).json({ success: false, message: `Patient ID '${patientId}' is already in use.` });
    }

    const patient = await Patient.create({
      patientId: patientId.toUpperCase(),
      fullName,
      age: age ? Number(age) : undefined,
      roomBed,
      primaryCaregiverName,
      caregiverEmail,
      caregiverPhone,
      assignedDevice: assignedDevice || null,
      notes,
    });

    if (assignedDevice) {
      await Device.findByIdAndUpdate(assignedDevice, { assignedPatient: patient._id });
    }

    const populated = await Patient.findById(patient._id).populate('assignedDevice');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const { assignedDevice } = req.body;
    const oldPatient = await Patient.findById(req.params.id);

    if (!oldPatient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // If changing assigned device, unassign previous device
    if (oldPatient.assignedDevice && oldPatient.assignedDevice.toString() !== assignedDevice) {
      await Device.findByIdAndUpdate(oldPatient.assignedDevice, { assignedPatient: null });
    }

    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedDevice');

    if (assignedDevice) {
      await Device.findByIdAndUpdate(assignedDevice, { assignedPatient: patient._id });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (patient.assignedDevice) {
      await Device.findByIdAndUpdate(patient.assignedDevice, { assignedPatient: null });
    }

    patient.isActive = false;
    await patient.save();

    res.json({ success: true, message: 'Patient deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
