import React, { useState, useEffect } from 'react';
import {
  Bell,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Wifi,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { notificationsApi } from '../api';

export default function TopNavbar({ title, onOpenSimulator, isSimulatorOpen, unreadCount = 0 }) {
  const { isConnected } = useSocket();
  const [timeStr, setTimeStr] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleNotifications = async () => {
    if (!showNotifications) {
      try {
        const res = await notificationsApi.getAll({ limit: 6 });
        setRecentNotifs(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500">MediStand Healthcare & Caregiver Portal</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock (Asia/Kolkata) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr || 'Loading...'} IST</span>
        </div>

        {/* Demo Simulator Toggle */}
        <button
          onClick={onOpenSimulator}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isSimulatorOpen
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title="Open interactive IoT sensor and reminder simulator"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>IoT Demo Simulator</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-elevated border border-slate-200 p-3 space-y-2 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Recent Alerts</span>
                <span className="text-[11px] text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {recentNotifs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
                ) : (
                  recentNotifs.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-lg text-xs border ${
                        n.type === 'overdue'
                          ? 'bg-rose-50/60 border-rose-100 text-rose-900'
                          : 'bg-slate-50 border-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Caregiver Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-semibold text-xs">
            OJ
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Dr. Om Jagdhane</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Lead Caregiver (On Duty)</p>
          </div>
        </div>
      </div>
    </header>
  );
}
