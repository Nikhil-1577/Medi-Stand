import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Clock,
  ArrowUpFromLine,
  ArrowDownToLine,
  Info,
} from 'lucide-react';
import { eventsApi, patientsApi } from '../api';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';

export default function MedicationHistory() {
  const { refreshKey } = useSocket();
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
      };
      if (selectedPatient) params.patientId = selectedPatient;
      if (selectedType) params.eventType = selectedType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [evRes, patRes] = await Promise.all([
        eventsApi.getAll(params),
        patientsApi.getAll(),
      ]);

      setEvents(evRes.data.data || []);
      setTotalPages(evRes.data.totalPages || 1);
      setTotalCount(evRes.data.total || 0);
      setPatients(patRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshKey, page, selectedPatient, selectedType, startDate, endDate]);

  const handleExportCSV = () => {
    if (events.length === 0) return;
    const headers = ['Timestamp', 'Patient', 'Device', 'Event Type', 'Raw Count', 'Delta', 'Source', 'Classification'];
    const rows = events.map((e) => [
      new Date(e.serverTimestamp).toISOString(),
      e.patient?.fullName || 'Unassigned',
      e.deviceId,
      e.eventType,
      e.rawValue,
      e.difference,
      e.source,
      `"${e.classification}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medistand_adherence_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Medication Interaction History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable physical telemetry log of medicine bottle removals and adherence timeline matches
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-soft transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Clinical Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-start gap-2.5 text-xs text-sky-900 leading-relaxed">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Clinical Adherence Clarification: </span>
          MediStand records verified physical weight deviations indicating when a bottle is lifted or returned. A recorded bottle-lift event indicates caregiver/patient interaction with the medication stand and does not prove pharmaceutical ingestion.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card-subtle p-4 bg-white grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 font-semibold mb-1">Filter by Patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => {
              setSelectedPatient(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
          >
            <option value="">All Monitored Patients</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.fullName} ({p.patientId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Event Type</label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
          >
            <option value="">All Event Classifications</option>
            <option value="bottle_lifted">Bottle Lifted</option>
            <option value="bottle_returned">Bottle Returned to Stand</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="card-subtle bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Authoritative Timestamp</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Hardware Unit</th>
                <th className="py-3 px-4">Physical Event</th>
                <th className="py-3 px-4">Load Cell Delta</th>
                <th className="py-3 px-4">Associated Dose Window</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No medication interaction events found matching the criteria.
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const isLift = ev.eventType === 'bottle_lifted';
                  return (
                    <tr key={ev._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-900">
                        <span className="font-semibold block">
                          {new Date(ev.serverTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(ev.serverTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {ev.patient?.fullName || 'Unassigned Patient'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                        {ev.deviceId}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium text-[11px] ${
                            isLift
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-sky-50 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {isLift ? <ArrowUpFromLine className="w-3 h-3 text-emerald-600" /> : <ArrowDownToLine className="w-3 h-3 text-sky-600" />}
                          {isLift ? 'Bottle Lifted' : 'Bottle Returned'}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ev.classification}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="font-bold text-slate-800">{ev.difference ? ev.difference.toLocaleString() : '0'}</span>
                        <span className="text-slate-400 ml-1">counts</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {ev.reminder ? (
                          <div>
                            <span className="font-semibold text-slate-800">{ev.reminder.medicationName}</span>
                            <span className="text-slate-400 block text-[10px]">Due: {ev.reminder.scheduledTimeStr}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unscheduled lift</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ev.source === 'simulation'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {ev.source.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {page} of {totalPages} ({totalCount} total events)
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50 font-medium"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
