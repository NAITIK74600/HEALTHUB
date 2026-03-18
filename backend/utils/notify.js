const Notification = require('../models/Notification');

/**
 * Create a notification for a user.
 */
async function notifyUser(userId, { type, title, message, relatedOrder = null }) {
  try {
    await Notification.create({ recipient: userId, isAdminNotif: false, type, title, message, relatedOrder });
  } catch (e) {
    console.error('[notify] user notif failed:', e.message);
  }
}

/**
 * Create a notification for the admin/shop dashboard.
 */
async function notifyAdmin({ type, title, message, relatedOrder = null }) {
  try {
    await Notification.create({ recipient: null, isAdminNotif: true, type, title, message, relatedOrder });
  } catch (e) {
    console.error('[notify] admin notif failed:', e.message);
  }
}

module.exports = { notifyUser, notifyAdmin };
