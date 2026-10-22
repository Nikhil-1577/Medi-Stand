import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarClock,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Bell,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { dashboardApi } from '../api';
import { useSocket } from '../context/SocketContext';
import BottleCard from '../components/BottleCard';
import StatusBadge from '../components/StatusBadge';

export default function Overview({ onNavigateTab }) {
  const { refreshKey } = useSocket();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await dashboardApi.getSummary();
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshKey]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchSummary(true);
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading MediStand Dashboard...</p>
        </div>
      </div>
    );
  }

  const { summary, primaryDevice, timeline, alerts, activityChart } = data || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Caregiver Monitoring Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time IoT load-cell telemetry and scheduled medication adherence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-soft transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patients */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="card-subtle p-5 bg-white cursor-pointer hover:border-brand-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Registered Patients</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary?.totalPatients || 0}</span>
            <span className="text-xs text-slate-400">active profiles</span>
          </div>
        </div>

        {/* Card 2: Today's Scheduled Reminders */}
        <div
          onClick={() => onNavigateTab('schedule')}
          className="card-subtle p-5 bg-white cursor-pointer hover:border-brand-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Scheduled Today</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary?.todayRemindersCount || 0}</span>
            <span className="text-xs text-slate-400">medication doses</span>
          </div>
        </div>

        {/* Card 3: Bottle Events Today */}
        <div
          onClick={() => onNavigateTab('history')}
          className="card-subtle p-5 bg-white cursor-pointer hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bottle Events Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary?.todayEventsCount || 0}</span>
            <span className="text-xs text-emerald-600 font-medium">weight shifts detected</span>
          </div>
        </div>

        {/* Card 4: Overdue Medication Reminders */}
        <div
          onClick={() => onNavigateTab('alerts')}
          className={`card-subtle p-5 cursor-pointer transition-all group ${
            summary?.overdueCount > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
              : 'bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overdue Reminders</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                summary?.overdueCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${summary?.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {summary?.overdueCount || 0}
            </span>
            <span className="text-xs text-slate-400">missed grace window</span>
          </div>
        </div>
      </div>

      {/* Featured Bottle Monitoring Card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-600" />
            Live Hardware Telemetry — Primary Stand
          </h3>
          <button
            onClick={() => onNavigateTab('monitoring')}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All Stands & Sensor Graph</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <BottleCard device={primaryDevice} />
      </div>

      {/* Grid: Medication Timeline & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Medication Timeline (2 cols) */}
        <div className="lg:col-span-2 card-subtle p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Today's Medication Schedule</h3>
              <p className="text-xs text-slate-500">Timeline of expected doses and bottle-lift timestamps</p>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Manage Schedules
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-2.5 font-medium">Scheduled Time</th>
                  <th className="pb-2.5 font-medium">Patient</th>
                  <th className="pb-2.5 font-medium">Medication</th>
                  <th className="pb-2.5 font-medium">Caregiver</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Bottle Interaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!timeline || timeline.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      No medication reminders scheduled for today.
                    </td>
                  </tr>
                ) : (
                  timeline.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-medium text-slate-900">
                        {item.scheduledTimeStr}
                      </td>
                      <td className="py-3 font-medium text-slate-800">
                        {item.patient?.fullName || 'Patient'}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-900">{item.medicationName}</span>
                        {item.dosage && <span className="text-slate-500 block text-[11px]">{item.dosage}</span>}
                      </td>
                      <td className="py-3 text-slate-600">
                        {item.assignedCaregiver || item.patient?.primaryCaregiverName || 'On Duty'}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 font-mono text-[11px]">
                        {item.interactionDetectedAt ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {new Date(item.interactionDetectedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No lift recorded</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Notifications Column (1 col) */}
        <div className="card-subtle p-6 bg-white space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-rose-500" />
                Critical Caregiver Alerts
              </h3>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                View All
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {!alerts || alerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  All medication schedules are on track.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-3 rounded-lg border text-xs ${
                      alert.type === 'overdue'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold leading-tight">{alert.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Caregiver Protocol:</span>
            <p>
              When an overdue alert fires, immediately visit the patient room to verify safety and administer the prescribed dose.
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Medication Adherence Activity Chart */}
      <div className="card-subtle p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">7-Day Adherence & Physical Interaction Trends</h3>
            <p className="text-xs text-slate-500">
              Comparing daily completed doses against overdue alarms and bottle removal events
            </p>
          </div>
          <span className="text-xs text-slate-400">Data source: Authoritative MediStand Database</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="completedDoses" name="Completed Doses" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdueDoses" name="Overdue Doses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bottleEvents" name="Total Bottle Lifts" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
