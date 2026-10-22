import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const patientsApi = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

export const schedulesApi = {
  getAll: (params) => api.get('/schedules', { params }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  toggle: (id) => api.patch(`/schedules/${id}/toggle`),
};

export const devicesApi = {
  getAll: () => api.get('/devices'),
  getById: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  getHistory: (deviceId, limit = 50) => api.get(`/devices/${deviceId}/history`, { params: { limit } }),
};

export const eventsApi = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
};

export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const simulationApi = {
  setDeviceStatus: (deviceId, status) => api.post('/simulation/device-status', { deviceId, status }),
  bottleLift: (deviceId) => api.post('/simulation/bottle-lift', { deviceId }),
  bottleReturn: (deviceId) => api.post('/simulation/bottle-return', { deviceId }),
  triggerReminder: (patientId, medicationName) => api.post('/simulation/trigger-reminder', { patientId, medicationName }),
  triggerOverdue: (reminderId) => api.post('/simulation/trigger-overdue', { reminderId }),
  resetDemoData: () => api.post('/simulation/reset-data'),
};

export default api;
