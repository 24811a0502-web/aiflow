const mongoose = require('mongoose');
const { createModel } = require('./modelAdapter');

const notificationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.Mixed, required: true },
    workflowId: { type: mongoose.Schema.Types.Mixed, default: null },
    executionId: { type: mongoose.Schema.Types.Mixed, default: null },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'escalation'],
      default: 'info',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MongooseNotification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
const Notification = createModel('notifications', MongooseNotification);

module.exports = Notification;
