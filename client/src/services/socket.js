import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://aiflow-grio.onrender.com';

let socket = null;

export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Agentflow real-time server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });
  }
  return socket;
}

export function subscribeToExecution(executionId, callback) {
  const s = getSocket();
  if (s) {
    s.emit('execution:join', executionId);
    s.on('agent:event', callback);
  }
}

export function unsubscribeFromExecution(executionId, callback) {
  const s = getSocket();
  if (s) {
    s.emit('execution:leave', executionId);
    if (callback) {
      s.off('agent:event', callback);
    }
  }
}
