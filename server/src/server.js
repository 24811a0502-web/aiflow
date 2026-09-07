const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env');
const { connectDB, getStoreStatus } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initExecutionQueue, isUsingInMemoryQueue } = require('./queues/executionQueue');
const orchestrator = require('./agents/orchestrator');

const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Security & Utility Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const storeStatus = getStoreStatus();
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: storeStatus.isConnected,
      inMemoryFallback: storeStatus.isInMemoryFallback,
    },
    queue: {
      inMemory: isUsingInMemoryQueue(),
    },
    langGraph: orchestrator.getLangGraphStatus(),
    aiProviders: {
      openRouter: Boolean(env.OPENROUTER_API_KEY),
      gemini: Boolean(env.GEMINI_API_KEY),
      deterministicFallback: true,
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  // Never log decrypted tokens or sensitive headers
  console.error(`[Error] ${err.message}`, err.code ? `Code: ${err.code}` : '');

  // Handle explicit integration and auth errors
  if (err.code === 'INTEGRATION_NOT_CONNECTED' || err.message?.includes('not connected')) {
    return res.status(400).json({
      success: false,
      code: 'INTEGRATION_NOT_CONNECTED',
      error: err.message,
    });
  }

  if (err.code === 'AUTH_EXPIRED' || err.message?.includes('expired')) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_EXPIRED',
      error: err.message,
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    error: err.message || 'An unexpected internal server error occurred',
  });
});

// Start Server
async function bootstrap() {
  await connectDB();
  initExecutionQueue();

  server.listen(env.PORT, () => {
    console.log(`======================================================`);
    console.log(`🚀 Agentflow_AI Server running on port ${env.PORT}`);
    console.log(`🌐 Client URL: ${env.CLIENT_URL}`);
    console.log(`📡 LangGraph Substrate: ${orchestrator.getLangGraphStatus()}`);
    console.log(`💾 Database: ${getStoreStatus().isInMemoryFallback ? 'In-Memory Store' : 'MongoDB'}`);
    console.log(`⚡ Background Queue: ${isUsingInMemoryQueue() ? 'In-Memory Async Queue' : 'BullMQ (Redis)'}`);
    console.log(`======================================================`);
  });
}

bootstrap();

module.exports = { app, server };
