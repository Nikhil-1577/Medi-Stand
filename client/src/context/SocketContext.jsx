import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { ...toast, id };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerGlobalRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    const s = io({
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('[Socket] Connected to MediStand server');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected from MediStand server');
      setIsConnected(false);
    });

    s.on('telemetry:stream', (data) => {
      setLatestTelemetry(data);
    });

    s.on('device:status', (data) => {
      addToast({
        type: data.status === 'online' ? 'success' : 'warning',
        title: `Device ${data.deviceId} is ${data.status.toUpperCase()}`,
        message: data.isSimulated ? '(Simulated hardware event)' : 'Hardware telemetry heartbeat received',
      });
      triggerGlobalRefresh();
    });

    s.on('event:new', (payload) => {
      const isLift = payload.event.eventType === 'bottle_lifted';
      addToast({
        type: isLift ? 'info' : 'success',
        title: isLift ? 'Medicine Bottle Lifted' : 'Medicine Bottle Returned',
        message: `${payload.patientName} — ${payload.event.classification}`,
      });
      triggerGlobalRefresh();
    });

    s.on('reminder:updated', (reminder) => {
      if (reminder.status === 'overdue') {
        addToast({
          type: 'danger',
          title: 'Medication OVERDUE Alert',
          message: `${reminder.medicationName} (${reminder.dosage}) was not lifted within the grace window!`,
        });
      } else if (reminder.status === 'reminder_sent') {
        addToast({
          type: 'warning',
          title: 'Medication Dose Due Now',
          message: `${reminder.medicationName} scheduled for ${reminder.scheduledTimeStr}. Awaiting bottle interaction.`,
        });
      }
      triggerGlobalRefresh();
    });

    s.on('notification:new', (notif) => {
      if (notif.type === 'overdue') {
        addToast({
          type: 'danger',
          title: notif.title,
          message: notif.message,
        });
      }
      triggerGlobalRefresh();
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latestTelemetry,
        toasts,
        removeToast,
        refreshKey,
        triggerGlobalRefresh,
        addToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
