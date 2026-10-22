import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Cpu,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Clock,
} from 'lucide-react';
import { patientsApi, devicesApi } from '../api';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';

export default function Patients() {
  const { refreshKey, addToast } = useSocket();
  const [patients, setPatients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    fullName: '',
    age: '',
    roomBed: '',
    primaryCaregiverName: '',
    caregiverEmail: '',
    caregiverPhone: '',
    assignedDevice: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patRes, devRes] = await Promise.all([
        patientsApi.getAll(),
        devicesApi.getAll(),
      ]);
      setPatients(patRes.data.data || []);
      setDevices(devRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormData({
      patientId: `PAT-${Math.floor(100 + Math.random() * 900)}`,
      fullName: '',
      age: '',
      roomBed: '',
      primaryCaregiverName: 'Dr. Om Jagdhane',
      caregiverEmail: 'om.jagdhane@medistand.io',
      caregiverPhone: '+91 98765 43210',
      assignedDevice: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPatient(p);
    setFormData({
      patientId: p.patientId,
      fullName: p.fullName,
      age: p.age || '',
      roomBed: p.roomBed || '',
      primaryCaregiverName: p.primaryCaregiverName,
      caregiverEmail: p.caregiverEmail,
      caregiverPhone: p.caregiverPhone || '',
      assignedDevice: p.assignedDevice?._id || p.assignedDevice || '',
      notes: p.notes || '',
    });
    setShowModal(true);
  };

  const handleViewDetails = async (patientId) => {
    try {
      const res = await patientsApi.getById(patientId);
      setSelectedPatientDetails(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await patientsApi.update(editingPatient._id, formData);
        addToast({ type: 'success', title: 'Patient Updated', message: `${formData.fullName} has been updated.` });
      } else {
        await patientsApi.create(formData);
        addToast({ type: 'success', title: 'Patient Created', message: `${formData.fullName} registered successfully.` });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast({
        type: 'danger',
        title: 'Error Saving Patient',
        message: err.response?.data?.message || err.message,
      });
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to deactivate patient ${p.fullName}?`)) return;
    try {
      await patientsApi.delete(p._id);
      addToast({ type: 'info', title: 'Patient Deactivated', message: `${p.fullName} deactivated.` });
      fetchData();
    } catch (err) {
      addToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId.toLowerCase().includes(search.toLowerCase()) ||
      (p.roomBed && p.roomBed.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage monitored patients, caregiver assignments, and dedicated MediStand devices
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-soft transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-subtle p-4 bg-white flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient name, ID, or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filteredPatients.length} active patients</span>
      </div>

      {/* Patients Table */}
      <div className="card-subtle bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Patient Identifier</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Room / Bed</th>
                <th className="py-3 px-4">Assigned MediStand</th>
                <th className="py-3 px-4">Primary Caregiver</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No matching patients found.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.patientId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <button
                        onClick={() => handleViewDetails(p._id)}
                        className="hover:text-brand-600 hover:underline text-left"
                      >
                        {p.fullName}
                      </button>
                      {p.age && <span className="text-slate-400 font-normal ml-1.5 text-[11px]">({p.age} yrs)</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.roomBed || 'General Ward'}</td>
                    <td className="py-3.5 px-4">
                      {p.assignedDevice ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-mono text-[11px] font-medium border border-brand-100">
                          <Cpu className="w-3 h-3 text-brand-500" />
                          {p.assignedDevice.deviceId || 'Assigned'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No Stand Linked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{p.primaryCaregiverName}</div>
                      <div className="text-slate-400 text-[11px]">{p.caregiverEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewDetails(p._id)}
                        className="px-2 py-1 text-slate-600 hover:text-brand-600 font-medium hover:bg-brand-50 rounded transition-colors"
                        title="View details & schedules"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Edit profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Deactivate patient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Patient */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-elevated border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPatient ? 'Edit Patient Information' : 'Register New Patient'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Patient Identifier *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="125"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Room / Bed Assignment</label>
                  <input
                    type="text"
                    value={formData.roomBed}
                    onChange={(e) => setFormData({ ...formData, roomBed: e.target.value })}
                    placeholder="e.g. Ward A - Bed 03"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Assign MediStand Unit</label>
                  <select
                    value={formData.assignedDevice}
                    onChange={(e) => setFormData({ ...formData, assignedDevice: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
                  >
                    <option value="">No device linked</option>
                    {devices.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.deviceId} — {d.name} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
                <span className="font-semibold text-slate-800 block text-xs">Primary Caregiver Notification Contact</span>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Caregiver Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.primaryCaregiverName}
                    onChange={(e) => setFormData({ ...formData, primaryCaregiverName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Caregiver Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.caregiverEmail}
                      onChange={(e) => setFormData({ ...formData, caregiverEmail: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Phone (SMS alerts)</label>
                    <input
                      type="tel"
                      value={formData.caregiverPhone}
                      onChange={(e) => setFormData({ ...formData, caregiverPhone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Clinical Notes (Adherence precautions)</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Memory impairment; requires strict morning observation."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-soft"
                >
                  {editingPatient ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Details Modal: Selected Patient Details */}
      {selectedPatientDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-elevated border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center">
                  {selectedPatientDetails.patient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedPatientDetails.patient.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    ID: <span className="font-mono font-medium">{selectedPatientDetails.patient.patientId}</span> • {selectedPatientDetails.patient.roomBed || 'Ward'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Assigned MediStand Stand</span>
                <span className="font-semibold text-slate-800">
                  {selectedPatientDetails.patient.assignedDevice ? (
                    `${selectedPatientDetails.patient.assignedDevice.name} (${selectedPatientDetails.patient.assignedDevice.deviceId})`
                  ) : (
                    'None assigned'
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned Caregiver</span>
                <span className="font-semibold text-slate-800">
                  {selectedPatientDetails.patient.primaryCaregiverName} ({selectedPatientDetails.patient.caregiverEmail})
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Caregiver Notes</span>
                <p className="text-slate-700 mt-0.5">{selectedPatientDetails.patient.notes || 'No specific notes recorded.'}</p>
              </div>
            </div>

            {/* Configured Medication Schedules */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                Active Medication Schedules
              </h4>
              <div className="space-y-2">
                {selectedPatientDetails.schedules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No schedules configured for this patient.</p>
                ) : (
                  selectedPatientDetails.schedules.map((s) => (
                    <div key={s._id} className="p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{s.medicationName}</span>
                        <span className="text-slate-500 ml-2">({s.dosage})</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{s.instructions || 'Daily prescribed dose'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-800 text-sm">{s.scheduledTime}</span>
                        <span className="text-[10px] text-slate-400 block">Grace: {s.gracePeriodMinutes} mins</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Medication History */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Recent Doses & Physical Bottle Interactions
              </h4>
              <div className="space-y-2">
                {selectedPatientDetails.recentReminders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recent dose records.</p>
                ) : (
                  selectedPatientDetails.recentReminders.map((r) => (
                    <div key={r._id} className="p-2.5 rounded-lg border border-slate-100 bg-white text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{r.medicationName}</span>
                        <span className="text-slate-400 text-[11px] ml-2">
                          Scheduled: {r.scheduledDateStr} {r.scheduledTimeStr}
                        </span>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
