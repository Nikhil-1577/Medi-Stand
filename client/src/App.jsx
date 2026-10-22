import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import DemoSimulatorBar from './components/DemoSimulatorBar';
import Overview from './pages/Overview';
import Patients from './pages/Patients';
import MedicationSchedule from './pages/MedicationSchedule';
import BottleMonitoring from './pages/BottleMonitoring';
import AlertsNotifications from './pages/AlertsNotifications';
import MedicationHistory from './pages/MedicationHistory';
import SettingsPage from './pages/Settings';
import { notificationsApi, devicesApi } from './api';
import { X, CheckCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

function DashboardContent() {
  const { toasts, removeToast, refreshKey } = useSocket();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [devices, setDevices] = useState([]);

  // Fetch unread notifications count and device fleet
  const fetchHeaderData = async () => {
    try {
      const [notifRes, devRes] = await Promise.all([
        notificationsApi.getAll({ limit: 1 }),
        devicesApi.getAll(),
      ]);
      setUnreadCount(notifRes.data.unreadCount || 0);
      setDevices(devRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHeaderData();
  }, [refreshKey]);

  const pageTitles = {
    overview: 'Caregiver Dashboard Overview',
    patients: 'Patient Directory & Bed Management',
    schedule: 'Medication Schedules & Timetables',
    monitoring: 'Smart Bottle Monitoring & Hardware',
    alerts: 'Alerts & Multi-Channel Notifications',
    history: 'Physical Interaction & Adherence History',
    settings: 'System & Caregiver Settings',
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreadAlertsCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNavbar
          title={pageTitles[currentTab] || 'MediStand'}
          onOpenSimulator={() => setIsSimulatorOpen(!isSimulatorOpen)}
          isSimulatorOpen={isSimulatorOpen}
          unreadCount={unreadCount}
        />

        {/* Demo Simulator Bar (Collapsible interactive bench) */}
        {isSimulatorOpen && (
          <DemoSimulatorBar
            onClose={() => setIsSimulatorOpen(false)}
            devices={devices}
          />
        )}

        {/* Dynamic Page Render */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && <Overview onNavigateTab={setCurrentTab} />}
          {currentTab === 'patients' && <Patients />}
          {currentTab === 'schedule' && <MedicationSchedule />}
          {currentTab === 'monitoring' && <BottleMonitoring />}
          {currentTab === 'alerts' && <AlertsNotifications />}
          {currentTab === 'history' && <MedicationHistory />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Real-time Toast Notifications Overlay */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isDanger = toast.type === 'danger';
          const isWarning = toast.type === 'warning';
          const isSuccess = toast.type === 'success';

          return (
            <div
              key={toast.id}
              className={`p-3.5 rounded-xl shadow-elevated border pointer-events-auto flex items-start gap-3 text-xs transition-all animate-in slide-in-from-bottom-2 ${
                isDanger
                  ? 'bg-rose-900 text-white border-rose-800'
                  : isWarning
                  ? 'bg-amber-900 text-white border-amber-800'
                  : isSuccess
                  ? 'bg-emerald-900 text-white border-emerald-800'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isDanger ? (
                  <AlertOctagon className="w-4 h-4 text-rose-300" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                ) : isSuccess ? (
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Info className="w-4 h-4 text-sky-300" />
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold block text-xs">{toast.title}</span>
                <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <DashboardContent />
    </SocketProvider>
  );
}
