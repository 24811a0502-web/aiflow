const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;
let isInMemoryFallback = false;

// In-memory document storage collections for fallback
const memoryStore = {
  users: new Map(),
  workflows: new Map(),
  executions: new Map(),
  executionLogs: new Map(),
  integrations: new Map(),
  notifications: new Map(),
  agentMemories: new Map(),
};

async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000, // Fast fallback if no mongo daemon
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed (${error.message}). Activating In-Memory Fallback Store.`);
    isConnected = true;
    isInMemoryFallback = true;
  }
}

function getStoreStatus() {
  return {
    isConnected,
    isInMemoryFallback,
    mongoUri: env.MONGO_URI,
  };
}

module.exports = {
  connectDB,
  getStoreStatus,
  memoryStore,
};
