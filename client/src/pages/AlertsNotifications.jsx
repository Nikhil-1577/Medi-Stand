import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  WifiOff,
  CheckCircle2,
  Mail,
  CheckCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Send,
  AlertOctagon,
} from 'lucide-react';
import { notificationsApi } from '../api';
import { useSocket } from '../context/SocketContext';

export default function AlertsNotifications() {
  const { refreshKey, addToast } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getAll({ limit: 100 });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [refreshKey]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast({ type: 'success', title: 'Notifications', message: 'All alerts marked as read.' });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'overdue') return n.type === 'overdue';
    if (filterType === 'device') return n.type === 'device_offline';
    if (filterType === 'reminder') return n.type === 'reminder';
    if (filterType === 'failed') return n.status === 'failed';
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Alerts & Caregiver Notifications</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit feed of automated reminder dispatches, overdue medication alerts, and hardware connection drops
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-soft transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Mark All Read</span>
            </button>
          )}
          <button
            onClick={fetchNotifs}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-soft"
            title="Refresh alerts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            filterType === 'all' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('overdue')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            filterType === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overdue Alarms
        </button>
        <button
          onClick={() => setFilterType('reminder')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            filterType === 'reminder' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Scheduled Reminders
        </button>
        <button
          onClick={() => setFilterType('device')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            filterType === 'device' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hardware Disconnects
        </button>
        <button
          onClick={() => setFilterType('failed')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            filterType === 'failed' ? 'bg-rose-800 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Delivery Failures
        </button>
      </div>

      {/* Notification Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card-subtle p-12 bg-white text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No alerts matching this filter</p>
            <p className="text-xs text-slate-400 mt-0.5">All monitored patient schedules are in compliant states.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const isOverdue = n.type === 'overdue';
            const isOffline = n.type === 'device_offline';
            const isFailed = n.status === 'failed';

            return (
              <div
                key={n._id}
                className={`card-subtle p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !n.isRead ? 'bg-white border-l-4 border-l-brand-600 shadow-xs' : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-600'
                        : isOffline
                        ? 'bg-amber-100 text-amber-600'
                        : isFailed
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : isOffline ? (
                      <WifiOff className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                        {n.channel.replace('_', ' ')}
                      </span>
                      {n.status === 'failed' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Delivery Failed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    {n.errorMessage && (
                      <p className="text-[11px] text-rose-600 font-mono mt-1 bg-rose-50 p-1.5 rounded">
                        Error: {n.errorMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>Recipient: <strong className="text-slate-600">{n.recipient}</strong></span>
                      {n.recipientEmail && <span>({n.recipientEmail})</span>}
                      <span>•</span>
                      <span className="font-mono">
                        {new Date(n.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="self-end sm:self-center px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors shrink-0"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
