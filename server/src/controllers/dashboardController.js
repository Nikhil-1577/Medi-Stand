const Patient = require('../models/Patient');
const Device = require('../models/Device');
const MedicationReminder = require('../models/MedicationReminder');
const MedicationEvent = require('../models/MedicationEvent');
const Notification = require('../models/Notification');

const getDashboardSummary = async (req, res, next) => {
  try {
    const tz = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Summary Metrics
    const [totalPatients, todayRemindersCount, todayEventsCount, overdueCount] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      MedicationReminder.countDocuments({
        scheduledDateTime: { $gte: startOfToday, $lte: endOfToday },
      }),
      MedicationEvent.countDocuments({
        serverTimestamp: { $gte: startOfToday, $lte: endOfToday },
      }),
      MedicationReminder.countDocuments({
        status: 'overdue',
      }),
    ]);

    // 2. Primary / Featured Bottle Monitoring Device
    const primaryDevice = await Device.findOne().populate('assignedPatient');

    // 3. Today's Medication Timeline
    const timeline = await MedicationReminder.find({
      scheduledDateTime: { $gte: startOfToday, $lte: endOfToday },
    })
      .populate('patient')
      .populate('bottleEvent')
      .sort({ scheduledDateTime: 1 });

    // 4. Critical Alerts (Overdue reminders, offline devices, failed notifications)
    const [recentAlerts, offlineDevices] = await Promise.all([
      Notification.find({
        type: { $in: ['overdue', 'device_offline'] },
      })
        .sort({ createdAt: -1 })
        .limit(5),
      Device.find({ status: 'offline' }).select('deviceId name lastHeartbeat assignedPatient'),
    ]);

    // 5. Activity Chart Data (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastReminders = await MedicationReminder.find({
      scheduledDateTime: { $gte: sevenDaysAgo },
    });

    const pastEvents = await MedicationEvent.find({
      serverTimestamp: { $gte: sevenDaysAgo },
    });

    // Bucket by day (Mon, Tue, etc.)
    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dateKey = d.toISOString().split('T')[0];
      chartMap[dateKey] = {
        date: dayLabel,
        bottleEvents: 0,
        completedDoses: 0,
        overdueDoses: 0,
      };
    }

    pastEvents.forEach((ev) => {
      const key = ev.serverTimestamp.toISOString().split('T')[0];
      if (chartMap[key] && ev.eventType === 'bottle_lifted') {
        chartMap[key].bottleEvents++;
      }
    });

    pastReminders.forEach((rem) => {
      const key = rem.scheduledDateTime.toISOString().split('T')[0];
      if (chartMap[key]) {
        if (rem.status === 'bottle_lifted') {
          chartMap[key].completedDoses++;
        } else if (rem.status === 'overdue') {
          chartMap[key].overdueDoses++;
        }
      }
    });

    const activityChart = Object.values(chartMap);

    res.json({
      success: true,
      data: {
        summary: {
          totalPatients,
          todayRemindersCount,
          todayEventsCount,
          overdueCount,
        },
        primaryDevice,
        timeline,
        alerts: recentAlerts,
        offlineDevices,
        activityChart,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
