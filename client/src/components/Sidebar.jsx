import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Cpu,
  Bell,
  History,
  Settings,
  ShieldCheck,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'schedule', label: 'Medication Schedule', icon: CalendarClock },
  { id: 'monitoring', label: 'Bottle Monitoring', icon: Cpu },
  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
  { id: 'history', label: 'Medication History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentTab, onSelectTab, unreadAlertsCount = 0 }) {
  const { isConnected, latestTelemetry } = useSocket();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 tracking-tight text-base">MediStand</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded border border-brand-200">
                IoT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Smart Caregiver Monitor</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'alerts' && unreadAlertsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Hardware Link Status Widget */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            ESP8266 Telemetry
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
              isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                POLL
              </>
            )}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-snug">
          {latestTelemetry
            ? `Device: ${latestTelemetry.deviceId} (${latestTelemetry.isBottlePresent ? 'Bottle On Stand' : 'Bottle Lifted'})`
            : 'Listening on port 5000 for ESP8266 NodeMCU packets.'}
        </p>

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200">
          <span>Timezone</span>
          <span className="font-medium text-slate-600">Asia/Kolkata</span>
        </div>
      </div>
    </aside>
  );
}
