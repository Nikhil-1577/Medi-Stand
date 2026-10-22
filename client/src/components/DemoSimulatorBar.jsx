import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUpFromLine,
  ArrowDownToLine,
  Wifi,
  WifiOff,
  BellRing,
  AlertOctagon,
  RotateCcw,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { simulationApi } from '../api';
import { useSocket } from '../context/SocketContext';

export default function DemoSimulatorBar({ onClose, devices = [] }) {
  const { addToast, triggerGlobalRefresh } = useSocket();
  const [selectedDevice, setSelectedDevice] = useState(devices[0]?.deviceId || 'MEDISTAND-001');
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (actionName, apiFn) => {
    try {
      setLoadingAction(actionName);
      const res = await apiFn();
      addToast({
        type: 'success',
        title: 'Simulation Executed',
        message: res.data.message || `${actionName} triggered successfully`,
      });
      triggerGlobalRefresh();
    } catch (err) {
      addToast({
        type: 'danger',
        title: 'Simulation Error',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-300/60 px-6 py-3 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-amber-950">IoT Demo Simulation Bench</span>
            <span className="hidden sm:inline text-amber-800 ml-1.5 text-[11px]">
              (Simulate ESP8266 NodeMCU & HX711 weight changes without physical hardware)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Device Selector */}
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-white border border-amber-300 rounded-md px-2 py-1 text-slate-800 font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.deviceId} ({d.name})
              </option>
            ))}
          </select>

          {/* Simulate Bottle Lift */}
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('Bottle Lift', () => simulationApi.bottleLift(selectedDevice))}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-semibold shadow-xs transition-colors"
            title="Triggers weight drop > 12000 counts"
          >
            {loadingAction === 'Bottle Lift' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpFromLine className="w-3 h-3 text-amber-600" />}
            <span>Lift Bottle</span>
          </button>

          {/* Simulate Bottle Return */}
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('Bottle Return', () => simulationApi.bottleReturn(selectedDevice))}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-semibold shadow-xs transition-colors"
            title="Weight returns to baseline"
          >
            {loadingAction === 'Bottle Return' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3 text-emerald-600" />}
            <span>Return Bottle</span>
          </button>

          {/* Toggle Device Offline / Online */}
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('Toggle Status', () => simulationApi.setDeviceStatus(selectedDevice, 'offline'))}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-semibold shadow-xs transition-colors"
            title="Simulate Wi-Fi disconnection / offline timeout"
          >
            <WifiOff className="w-3 h-3 text-rose-500" />
            <span>Simulate Offline</span>
          </button>

          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('Connect Device', () => simulationApi.setDeviceStatus(selectedDevice, 'online'))}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-semibold shadow-xs transition-colors"
            title="Simulate Wi-Fi connection restored"
          >
            <Wifi className="w-3 h-3 text-emerald-600" />
            <span>Simulate Online</span>
          </button>

          {/* Trigger Scheduled Reminder */}
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('Trigger Reminder', () => simulationApi.triggerReminder())}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs transition-colors"
            title="Triggers an active medication dose right now"
          >
            {loadingAction === 'Trigger Reminder' ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellRing className="w-3 h-3" />}
            <span>Trigger Due Dose</span>
          </button>

          {/* Simulate Overdue */}
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('Mark Overdue', () => simulationApi.triggerOverdue())}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs transition-colors"
            title="Forces grace period expiration on active dose"
          >
            {loadingAction === 'Mark Overdue' ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertOctagon className="w-3 h-3" />}
            <span>Force Overdue</span>
          </button>

          {/* Reset Demo Data */}
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('Reset Data', () => simulationApi.resetDemoData())}
            className="p-1 rounded text-amber-900 hover:bg-amber-200/60 transition-colors"
            title="Reset to clean baseline demo scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close Banner */}
          <button
            onClick={onClose}
            className="p-1 rounded text-amber-900 hover:bg-amber-200/60 transition-colors"
            title="Hide simulator bar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
