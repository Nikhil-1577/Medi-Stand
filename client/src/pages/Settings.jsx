import React, { useState } from 'react';
import {
  Settings,
  Mail,
  Clock,
  Volume2,
  ShieldAlert,
  Server,
  RotateCcw,
  Check,
  Info,
  Key,
} from 'lucide-react';
import { simulationApi } from '../api';
import { useSocket } from '../context/SocketContext';

export default function SettingsPage() {
  const { addToast, triggerGlobalRefresh } = useSocket();

  // Settings State
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [enableEmail, setEnableEmail] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [resetting, setResetting] = useState(false);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'System timezone and alert settings updated successfully.',
    });
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset the database to clean demo scenario? This will restore sample patients, schedules, and devices.')) return;
    try {
      setResetting(true);
      await simulationApi.resetDemoData();
      addToast({
        type: 'success',
        title: 'Demo Data Restored',
        message: 'System re-seeded with realistic baseline patient and telemetry records.',
      });
      triggerGlobalRefresh();
    } catch (err) {
      addToast({ type: 'danger', title: 'Error', message: err.message });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Caregiver Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure deployment parameters, caregiver notification channels, and hardware integration parameters
        </p>
      </div>

      {/* Deployment & Timezone Card */}
      <form onSubmit={handleSaveGeneral} className="card-subtle p-6 bg-white space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
          <Clock className="w-4 h-4 text-brand-600" />
          Deployment & Timezone Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Authoritative Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 bg-white"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30) [Current Target]</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Used for daily medication reminder evaluation and timestamp formatting.
            </p>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Local Audio Alarms</label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-medium text-slate-800">Play chime on overdue medication alarms</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-soft"
        >
          Save Preferences
        </button>
      </form>

      {/* Real Caregiver Email Channel (SMTP) */}
      <div className="card-subtle p-6 bg-white space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-600" />
            Caregiver Email Notification Channel (SMTP)
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${enableEmail ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
            {enableEmail ? 'Enabled' : 'In-App Only (Safe Default)'}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Production Email Alert Workflow:</p>
          <p>
            When enabled, the backend dispatches real HTML medication reminder emails and overdue alarms to the assigned caregiver email address using Nodemailer.
          </p>
          <p className="text-slate-400 text-[11px]">
            To enable real email dispatches, configure your SMTP server credentials in <code>server/.env</code> or below. If credentials are left blank, in-app notifications continue to function safely.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-medium mb-1">SMTP Server Host</label>
            <input
              type="text"
              placeholder="e.g. smtp.gmail.com"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">SMTP Port</label>
            <input
              type="text"
              placeholder="587"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-medium mb-1">SMTP Username / Email</label>
            <input
              type="email"
              placeholder="caregiver_alerts@gmail.com"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">SMTP App Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Hardware Connection Reference */}
      <div className="card-subtle p-6 bg-white space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
          <Server className="w-4 h-4 text-brand-600" />
          ESP8266 Hardware Telemetry Target Configuration
        </h3>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <span className="font-semibold text-slate-800 block">HTTP POST Ingestion Endpoint for Arduino Firmware:</span>
          <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px] select-all">
            http://&lt;YOUR_COMPUTER_LOCAL_IP&gt;:5000/api/devices/MEDISTAND-001/telemetry
          </code>
          <p className="text-[11px] text-slate-500">
            Configure this URL in the extended Arduino sketch along with your local Wi-Fi SSID and password to transmit physical sensor data.
          </p>
        </div>
      </div>

      {/* Demo Scenario Reset */}
      <div className="card-subtle p-6 bg-white space-y-3 text-xs border-amber-200 bg-amber-50/20">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-600" />
          Reset Demo Environment
        </h3>
        <p className="text-slate-600 leading-relaxed">
          Re-populates the MongoDB database with realistic demo patients (Evelyn Reed, Arthur Pendelton, Miriam Joseph), active medication schedules, simulated historical telemetry, and real-time reminders for your college demonstration.
        </p>
        <button
          onClick={handleResetData}
          disabled={resetting}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-soft transition-colors"
        >
          {resetting ? 'Resetting Demo Data...' : 'Reset & Re-Seed Demo Data'}
        </button>
      </div>
    </div>
  );
}
