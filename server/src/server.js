const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { startScheduler } = require('./services/schedulerService');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const patientRoutes = require('./routes/patientRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

// Auto seed check
const Patient = require('./models/Patient');
const { runSeed } = require('./utils/seedData');

const app = express();
const server = http.createServer(app);

// Initialize real-time Socket.IO
initSocket(server);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MediStand IoT Backend',
    timestamp: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/simulation', simulationRoutes);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const db = await connectDB();

  if (db) {
    // Check if initial seed is needed
    try {
      const patientCount = await Patient.countDocuments();
      if (patientCount === 0) {
        console.log('[Startup] Empty database detected. Running initial seed...');
        await runSeed();
      }
    } catch (seedErr) {
      console.warn('[Startup] Auto-seed error:', seedErr.message);
    }
  }

  // Start background medication scheduler & heartbeat watchdog
  startScheduler();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  MediStand Smart Medication Monitoring Server Running `);
    console.log(`  Port: ${PORT} | Timezone: ${process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata'}`);
    console.log(`  API Base: http://localhost:${PORT}/api`);
    console.log(`  Telemetry Endpoint: POST /api/devices/:deviceId/telemetry`);
    console.log(`=======================================================`);
  });
};

startServer();

module.exports = { app, server };
