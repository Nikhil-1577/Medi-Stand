import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Scale,
  Settings2,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Code2,
  Terminal,
  Zap,
  Clock,
  ArrowUpFromLine,
  ArrowDownToLine,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { devicesApi } from '../api';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';

export default function BottleMonitoring() {
  const { latestTelemetry, addToast } = useSocket();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Calibration Form State
  const [weightThreshold, setWeightThreshold] = useState(12000);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await devicesApi.getAll();
      const devList = res.data.data || [];
      setDevices(devList);
      if (devList.length > 0 && !selectedDevice) {
        setSelectedDevice(devList[0]);
        setWeightThreshold(devList[0].weightThreshold || 12000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (devId) => {
    try {
      const res = await devicesApi.getHistory(devId, 30);
      const chartPoints = (res.data.data || []).map((t) => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        rawValue: t.rawValue,
        difference: t.difference,
        baseline: t.baseline,
      }));
      setTelemetryHistory(chartPoints);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchHistory(selectedDevice.deviceId);
    }
  }, [selectedDevice?.deviceId]);

  // Live telemetry listener appending to chart
  useEffect(() => {
    if (latestTelemetry && selectedDevice && latestTelemetry.deviceId === selectedDevice.deviceId) {
      setTelemetryHistory((prev) => {
        const newPoint = {
          time: new Date(latestTelemetry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rawValue: latestTelemetry.rawValue,
          difference: latestTelemetry.difference,
          baseline: latestTelemetry.baseline,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-30);
      });
    }
  }, [latestTelemetry, selectedDevice]);

  const handleCopyKey = () => {
    if (selectedDevice?.apiKey) {
      navigator.clipboard.writeText(selectedDevice.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSaveThreshold = async () => {
    if (!selectedDevice) return;
    try {
      setSavingSettings(true);
      const res = await devicesApi.update(selectedDevice._id, {
        weightThreshold: Number(weightThreshold),
      });
      setSelectedDevice(res.data.data);
      addToast({
        type: 'success',
        title: 'Sensor Calibration Saved',
        message: `Detection threshold set to ${Number(weightThreshold).toLocaleString()} raw counts.`,
      });
    } catch (err) {
      addToast({ type: 'danger', title: 'Error', message: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTareBaseline = async () => {
    if (!selectedDevice) return;
    try {
      const currentReading = latestTelemetry?.rawValue || selectedDevice.currentRaw || -378000;
      const res = await devicesApi.update(selectedDevice._id, {
        baselineRaw: currentReading,
      });
      setSelectedDevice(res.data.data);
      addToast({
        type: 'info',
        title: 'Stand Tared to Baseline',
        message: `New baseline calibrated at ${currentReading.toLocaleString()} raw counts.`,
      });
    } catch (err) {
      addToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bottle Monitoring & IoT Hardware</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            NodeMCU ESP8266 + HX711 24-bit ADC load cell telemetry stream and sensor calibration
          </p>
        </div>
      </div>

      {/* Device Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {devices.map((d) => {
          const isSelected = selectedDevice?.deviceId === d.deviceId;
          return (
            <div
              key={d.deviceId}
              onClick={() => {
                setSelectedDevice(d);
                setWeightThreshold(d.weightThreshold || 12000);
              }}
              className={`card-subtle p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-brand-500 bg-brand-50/20' : 'bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-600" />
                  <span className="font-bold text-slate-900 text-xs">{d.deviceId}</span>
                </div>
                <StatusBadge status={d.status} type="device" />
              </div>
              <p className="font-semibold text-slate-800 text-xs mt-2">{d.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Patient: <span className="text-slate-700 font-medium">{d.assignedPatient?.fullName || 'Unassigned'}</span>
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Threshold: &gt;{d.weightThreshold?.toLocaleString()}</span>
                <span>{d.isBottlePresent ? 'Bottle Resting' : 'Bottle Lifted'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Telemetry Waveform */}
      <div className="card-subtle p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">
                Live Sensor Telemetry: {selectedDevice?.name || 'MediStand Stand'} ({selectedDevice?.deviceId})
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                HX711 24-Bit Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time delta from baseline. A sustained drop &gt; {weightThreshold.toLocaleString()} counts indicates a bottle-removal event.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTareBaseline}
              className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Tare Baseline
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                }}
              />
              <ReferenceLine y={weightThreshold} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Trigger Threshold', fill: '#f43f5e', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="difference"
                name="Weight Change Delta"
                stroke="#0284c7"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Calibration & ESP8266 Hardware Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensor Calibration & Threshold Panel */}
        <div className="card-subtle p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              Sensor Calibration & Threshold Configuration
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-700 block">Current Stand Calibration State</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Configured Baseline:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedDevice?.baselineRaw?.toLocaleString() || '-378,000'} counts
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Active Difference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {latestTelemetry?.difference?.toLocaleString() || '0'} counts
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Weight Delta Trigger Threshold (Provisional default: 12,000 raw counts)
              </label>
              <input
                type="number"
                step="500"
                value={weightThreshold}
                onChange={(e) => setWeightThreshold(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                When raw count change exceeds this value, a bottle-removal event is triggered and evaluated against active reminders.
              </p>
            </div>

            <button
              onClick={handleSaveThreshold}
              disabled={savingSettings}
              className="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-soft transition-colors text-xs"
            >
              {savingSettings ? 'Saving...' : 'Update Trigger Threshold'}
            </button>
          </div>
        </div>

        {/* ESP8266 Hardware Pinout & Wiring Specifications */}
        <div className="card-subtle p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-600" />
              ESP8266 Pinout & Hardware Specification
            </h3>
            <span className="text-[10px] font-mono text-slate-400">NodeMCU v1.0</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Component</th>
                    <th className="py-2 px-3">NodeMCU Pin</th>
                    <th className="py-2 px-3">ESP8266 GPIO</th>
                    <th className="py-2 px-3">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">HX711 DT</td>
                    <td className="py-2 px-3 text-brand-600 font-bold">D6</td>
                    <td className="py-2 px-3 text-slate-600">GPIO12</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">Serial Data Out</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">HX711 SCK</td>
                    <td className="py-2 px-3 text-brand-600 font-bold">D5</td>
                    <td className="py-2 px-3 text-slate-600">GPIO14</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">Power Down / Clock</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Buzzer Alert</td>
                    <td className="py-2 px-3 text-amber-600 font-bold">D7</td>
                    <td className="py-2 px-3 text-slate-600">GPIO13</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">Audible Local Alarm</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">LED Indicator</td>
                    <td className="py-2 px-3 text-amber-600 font-bold">D2</td>
                    <td className="py-2 px-3 text-slate-600">GPIO4</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">Visual Status LED</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Device Key */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1 font-semibold">Device Hardware API Key (`x-device-key`)</span>
              <div className="flex items-center justify-between bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-800">
                <span>{selectedDevice?.apiKey || 'mst_default_dev_key'}</span>
                <button
                  onClick={handleCopyKey}
                  className="text-slate-400 hover:text-slate-700 ml-2 p-1"
                  title="Copy API Key for Arduino firmware"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
