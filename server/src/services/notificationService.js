const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const { broadcast } = require('./socketService');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587', 10),
        secure: SMTP_PORT === '465',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      console.log('[NotificationService] SMTP Transporter configured.');
    } catch (err) {
      console.error('[NotificationService] Error initializing SMTP transporter:', err.message);
    }
  }
  return transporter;
};

/**
 * Dispatch notification across in-app and optional email channels
 */
const sendNotification = async ({
  recipient,
  recipientEmail,
  type = 'reminder',
  title,
  message,
  relatedPatient = null,
  relatedReminder = null,
  relatedDevice = null,
}) => {
  try {
    // 1. Always create the authoritative in-app notification
    const inAppRecord = await Notification.create({
      recipient,
      recipientEmail,
      type,
      title,
      message,
      channel: 'in_app',
      status: 'delivered',
      relatedPatient,
      relatedReminder,
      relatedDevice,
    });

    broadcast('notification:new', inAppRecord);

    // 2. Email Notification Channel (if enabled and email provided)
    if (recipientEmail && process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      const mailer = getTransporter();
      if (mailer) {
        try {
          const mailOptions = {
            from: process.env.SMTP_FROM || 'MediStand Alerts <alerts@medistand.local>',
            to: recipientEmail,
            subject: `[MediStand] ${title}`,
            text: `${message}\n\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\nMediStand IoT Medication Adherence System`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0284c7; margin-top: 0;">MediStand Smart Caregiver Alert</h2>
                <h3 style="color: #1e293b;">${title}</h3>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">${message}</p>
                <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-left: 4px solid #0284c7; font-size: 13px; color: #64748b;">
                  Patient/Device interaction status will be recorded automatically when the medicine bottle is lifted from the MediStand.
                </div>
              </div>
            `,
          };

          const info = await mailer.sendMail(mailOptions);
          console.log(`[NotificationService] Email sent to ${recipientEmail}: ${info.messageId}`);

          await Notification.create({
            recipient,
            recipientEmail,
            type,
            title,
            message,
            channel: 'email',
            status: 'delivered',
            relatedPatient,
            relatedReminder,
            relatedDevice,
          });
        } catch (emailErr) {
          console.warn(`[NotificationService] Failed to send email to ${recipientEmail}:`, emailErr.message);

          await Notification.create({
            recipient,
            recipientEmail,
            type,
            title,
            message,
            channel: 'email',
            status: 'failed',
            errorMessage: emailErr.message,
            relatedPatient,
            relatedReminder,
            relatedDevice,
          });
        }
      }
    }

    return inAppRecord;
  } catch (error) {
    console.error('[NotificationService] Notification dispatch error:', error);
    return null;
  }
};

module.exports = {
  sendNotification,
};
