const ExecutionLog = require('../models/ExecutionLog');
const Notification = require('../models/Notification');
const { emitAgentEvent, emitNotification } = require('../config/socket');

/**
 * Monitoring Agent: Persists ExecutionLog records, streams Socket.IO live timeline events,
 * and creates user notifications for critical status transitions.
 */
class MonitoringAgent {
  async emitEvent({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
    const logData = {
      executionId,
      workflowId,
      nodeId,
      agent,
      level,
      message,
      metadata,
      timestamp: new Date(),
    };

    // 1. Write one ExecutionLog per agent event
    const savedLog = await ExecutionLog.create(logData);

    // 2. Broadcast live event via Socket.IO
    emitAgentEvent(executionId, savedLog);

    return savedLog;
  }

  async notifyUser({ ownerId, workflowId, executionId, type, title, message }) {
    const notification = await Notification.create({
      owner: ownerId,
      workflowId,
      executionId,
      type,
      title,
      message,
      isRead: false,
    });

    emitNotification(ownerId, notification);
    return notification;
  }
}

module.exports = new MonitoringAgent();
