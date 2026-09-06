const Notification = require('../models/Notification');

class NotificationController {
  async listNotifications(req, res, next) {
    try {
      const notifications = await Notification.find({ owner: req.user.id });
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({
        success: true,
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
      return res.status(200).json({
        success: true,
        data: { notification: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const notifications = await Notification.find({ owner: req.user.id });
      for (const item of notifications) {
        await Notification.findByIdAndUpdate(item._id || item.id, { isRead: true });
      }
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
