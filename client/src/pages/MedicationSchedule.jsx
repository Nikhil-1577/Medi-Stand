import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  Check,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';
import { schedulesApi, patientsApi } from '../api';
import { useSocket } from '../context/SocketContext';

const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MedicationSchedule() {
  const { refreshKey, addToast } = useSocket();
  const [schedules, setSchedules] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    patient: '',
    medicationName: '',
    dosage: '1 Tablet',
    instructions: '',
    scheduledTime: '08:00',
    frequency: 'daily',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    reminderLeadTimeMinutes: 15,
    gracePeriodMinutes: 45,
    assignedCaregiver: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, patRes] = await Promise.all([
        schedulesApi.getAll(),
        patientsApi.getAll(),
      ]);
      setSchedules(schedRes.data.data || []);
      setPatients(patRes.data.data || []);
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
    setEditingSchedule(null);
    setFormData({
      patient: patients[0]?._id || '',
      medicationName: '',
      dosage: '1 Tablet',
      instructions: '',
      scheduledTime: '08:00',
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      reminderLeadTimeMinutes: 15,
      gracePeriodMinutes: 45,
      assignedCaregiver: 'Dr. Om Jagdhane',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSchedule(s);
    setFormData({
      patient: s.patient?._id || s.patient,
      medicationName: s.medicationName,
      dosage: s.dosage || '',
      instructions: s.instructions || '',
      scheduledTime: s.scheduledTime,
      frequency: s.frequency || 'daily',
      daysOfWeek: s.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      reminderLeadTimeMinutes: s.reminderLeadTimeMinutes || 15,
      gracePeriodMinutes: s.gracePeriodMinutes || 45,
      assignedCaregiver: s.assignedCaregiver || '',
    });
    setShowModal(true);
  };

  const handleToggleDay = (dayIndex) => {
    let nextDays = [...formData.daysOfWeek];
    if (nextDays.includes(dayIndex)) {
      if (nextDays.length > 1) {
        nextDays = nextDays.filter((d) => d !== dayIndex);
      }
    } else {
      nextDays.push(dayIndex);
      nextDays.sort();
    }
    setFormData({ ...formData, daysOfWeek: nextDays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await schedulesApi.update(editingSchedule._id, formData);
        addToast({ type: 'success', title: 'Schedule Updated', message: `${formData.medicationName} schedule saved.` });
      } else {
        await schedulesApi.create(formData);
        addToast({ type: 'success', title: 'Schedule Created', message: `${formData.medicationName} added with idempotent key.` });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast({
        type: 'danger',
        title: 'Error Saving Schedule',
        message: err.response?.data?.message || err.message,
      });
    }
  };

  const handleToggleEnable = async (s) => {
    try {
      await schedulesApi.toggle(s._id);
      addToast({
        type: 'info',
        title: 'Schedule Toggled',
        message: `${s.medicationName} is now ${s.enabled ? 'Disabled' : 'Enabled'}.`,
      });
      fetchData();
    } catch (err) {
      addToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Are you sure you want to delete the schedule for ${s.medicationName}?`)) return;
    try {
      await schedulesApi.delete(s._id);
      addToast({ type: 'info', title: 'Schedule Deleted', message: 'Medication schedule removed.' });
      fetchData();
    } catch (err) {
      addToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const filtered = schedules.filter(
    (s) =>
      s.medicationName.toLowerCase().includes(search.toLowerCase()) ||
      (s.patient?.fullName && s.patient.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Medication Schedules</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure scheduled reminder times, lead alerts, and grace windows (Timezone: Asia/Kolkata)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-soft transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Medication Schedule</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-subtle p-4 bg-white flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by medication or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} active schedules</span>
      </div>

      {/* Table */}
      <div className="card-subtle bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Scheduled Time</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Medication & Dosage</th>
                <th className="py-3 px-4">Frequency / Days</th>
                <th className="py-3 px-4">Lead Time / Grace</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No medication schedules configured yet.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {s.scheduledTime}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{s.patient?.fullName || 'Patient'}</span>
                      <span className="text-[11px] text-slate-400">{s.patient?.patientId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{s.medicationName}</span>
                      <span className="text-slate-500 block text-[11px]">{s.dosage}</span>
                      {s.instructions && (
                        <span className="text-[10px] text-slate-400 italic block mt-0.5 line-clamp-1">
                          {s.instructions}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-medium text-slate-700 block">{s.frequency}</span>
                      <div className="flex gap-1 mt-1">
                        {DAYS_MAP.map((day, idx) => (
                          <span
                            key={day}
                            className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                              s.daysOfWeek.includes(idx)
                                ? 'bg-brand-100 text-brand-800'
                                : 'bg-slate-100 text-slate-300'
                            }`}
                          >
                            {day.charAt(0)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Lead: <strong className="text-slate-800">{s.reminderLeadTimeMinutes}m</strong></div>
                      <div>Grace: <strong className="text-slate-800">{s.gracePeriodMinutes}m</strong></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleEnable(s)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          s.enabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {s.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Edit schedule"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete schedule"
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

      {/* Modal: Add/Edit Schedule */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-elevated border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingSchedule ? 'Edit Medication Schedule' : 'Create Medication Schedule'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Patient *</label>
                <select
                  required
                  value={formData.patient}
                  onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
                >
                  <option value="">Select Monitored Patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.patientId} - {p.roomBed || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Medication Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin 500mg"
                    value={formData.medicationName}
                    onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Tablet / 2 Puffs"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Scheduled Time (24h) *</label>
                  <input
                    type="time"
                    required
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lead Alert (mins)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.reminderLeadTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, reminderLeadTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Grace Period (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    value={formData.gracePeriodMinutes}
                    onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5">Scheduled Days of Week</label>
                <div className="flex gap-2">
                  {DAYS_MAP.map((d, idx) => {
                    const isSelected = formData.daysOfWeek.includes(idx);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => handleToggleDay(idx)}
                        className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-700 shadow-xs'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Instructions / Meal Precautions</label>
                <input
                  type="text"
                  placeholder="e.g. Take immediately after lunch with water"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned Caregiver</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={formData.assignedCaregiver}
                  onChange={(e) => setFormData({ ...formData, assignedCaregiver: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
                />
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
                  {editingSchedule ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
