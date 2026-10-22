import React from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  Scale,
  Activity,
  Calendar,
  AlertCircle,
  Clock,
  ArrowUpFromLine,
  ArrowDownToLine,
  CheckCircle,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useSocket } from '../context/SocketContext';

export default function BottleCard({ device, onCalibrate }) {
  const { latestTelemetry } = useSocket();

  // If live telemetry stream matches this device, use real-time values
  const isTargetDevice = latestTelemetry && (!device || latestTelemetry.deviceId === device.deviceId);
  const currentStatus = isTargetDevice ? latestTelemetry.status : device?.status || 'offline';
  const rawValue = isTargetDevice ? latestTelemetry.rawValue : device?.currentRaw;
  const baseline = isTargetDevice ? latestTelemetry.baseline : device?.baselineRaw;
  const difference = isTargetDevice ? latestTelemetry.difference : Math.abs((device?.currentRaw || 0) - (device?.baselineRaw || 0));
  const isBottlePresent = isTargetDevice ? latestTelemetry.isBottlePresent : device?.isBottlePresent !== false;
  const threshold = device?.weightThreshold || 12000;
  const isSimulated = isTargetDevice ? latestTelemetry.isSimulated : device?.isSimulated;

  const isOnline = currentStatus === 'online';

  return (
    <div className="card-subtle p-6 bg-white relative overflow-hidden">
      {/* Simulation / Real Hardware Tag */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">{device?.name || 'MediStand IoT Unit'}</h3>
              <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {device?.deviceId || 'MEDISTAND-001'}
              </span>
              {isSimulated && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded border border-amber-200">
                  Demo Simulated
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned: <span className="font-medium text-slate-700">{device?.assignedPatient?.fullName || 'Ajij Shaikh (Ward B - Bed 12)'}</span>
            </p>
          </div>
        </div>

        <StatusBadge status={currentStatus} type="device" />
      </div>

      {/* Sensor Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {/* Connection & Heartbeat */}
        <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Last Transmit
          </span>
          <span className="text-xs font-semibold text-slate-800 mt-1 block">
            {isOnline ? 'Active Stream' : device?.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Data'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {device?.ipAddress ? `IP: ${device.ipAddress}` : 'Wi-Fi Standby'}
          </span>
        </div>

        {/* Load Cell Baseline */}
        <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
            <Scale className="w-3 h-3 text-slate-400" /> Tare Baseline
          </span>
          <span className="text-xs font-semibold font-mono text-slate-800 mt-1 block">
            {isOnline && baseline !== undefined ? baseline.toLocaleString() : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">HX711 raw tare</span>
        </div>

        {/* Current Sensor Reading */}
        <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
            <Activity className="w-3 h-3 text-slate-400" /> Current Raw Count
          </span>
          <span className="text-xs font-semibold font-mono text-slate-800 mt-1 block">
            {isOnline && rawValue !== undefined ? rawValue.toLocaleString() : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Delta: {isOnline && difference !== undefined ? `${difference.toLocaleString()} counts` : '—'}
          </span>
        </div>

        {/* Bottle Placement State */}
        <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
            {isBottlePresent ? (
              <ArrowDownToLine className="w-3 h-3 text-emerald-600" />
            ) : (
              <ArrowUpFromLine className="w-3 h-3 text-amber-600" />
            )}
            Stand Status
          </span>
          <span
            className={`text-xs font-bold mt-1 block ${
              !isOnline
                ? 'text-slate-400'
                : isBottlePresent
                ? 'text-emerald-700'
                : 'text-amber-700'
            }`}
          >
            {!isOnline
              ? 'Offline'
              : isBottlePresent
              ? 'Bottle Resting'
              : 'Bottle Lifted'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Trigger: &gt;{threshold.toLocaleString()} counts
          </span>
        </div>
      </div>

      {/* Last Detected Physical Interaction */}
      <div className="p-3 rounded-lg bg-brand-50/50 border border-brand-100/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
          <span className="text-slate-600">
            Last Detected Event: <strong className="text-slate-900">{device?.lastEventType ? (device.lastEventType === 'bottle_lifted' ? 'Bottle lifted' : 'Bottle returned') : 'No recent lift'}</strong>
          </span>
          {device?.lastEventAt && (
            <span className="text-slate-400 font-mono text-[11px]">
              ({new Date(device.lastEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 italic">
          Authoritative server timestamp verification
        </span>
      </div>
    </div>
  );
}
