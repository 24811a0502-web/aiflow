const { Server } = require('socket.io');
const env = require('./env');

let ioInstance = null;

function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    // Join execution room for live streaming
    socket.on('execution:join', (executionId) => {
      socket.join(`execution:${executionId}`);
    });

    socket.on('execution:leave', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    // Join user channel for notifications
    socket.on('user:join', (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

// Helper to broadcast agent event to execution room
function emitAgentEvent(executionId, eventPayload) {
  if (ioInstance) {
    ioInstance.to(`execution:${executionId}`).emit('agent:event', eventPayload);
  }
}

// Helper to broadcast execution status update
function emitExecutionStatus(executionId, statusPayload) {
  if (ioInstance) {
    ioInstance.to(`execution:${executionId}`).emit('execution:status', statusPayload);
    // Also emit generally
    ioInstance.emit('execution:update', statusPayload);
  }
}

// Helper to broadcast notification to user
function emitNotification(userId, notification) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
    // Also emit broadcast
    ioInstance.emit('notification:new', notification);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitAgentEvent,
  emitExecutionStatus,
  emitNotification,
};
