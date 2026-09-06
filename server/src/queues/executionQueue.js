const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let bullQueue = null;
let bullWorker = null;
let isUsingInMemoryQueue = false;

// Simple in-memory queue fallback
const inMemoryQueue = {
  queue: [],
  processing: false,
  push(jobData) {
    this.queue.push(jobData);
    this.processNext();
  },
  async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const job = this.queue.shift();
    try {
      await orchestrator.runWorkflow(job.executionId, job.ownerId);
    } catch (err) {
      console.error('[InMemoryQueue] Error running workflow:', err);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  },
};

function initExecutionQueue() {
  if (env.REDIS_URL) {
    try {
      const redisConnection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        retryStrategy(times) {
          if (times > 2) return null; // stop reconnecting to fallback quickly
          return 500;
        },
      });

      redisConnection.on('error', (err) => {
        if (!isUsingInMemoryQueue) {
          console.warn(`[ExecutionQueue] Redis unavailable (${err.message}). Using in-memory execution queue fallback.`);
          isUsingInMemoryQueue = true;
        }
      });

      redisConnection.on('connect', () => {
        console.log('[ExecutionQueue] Connected to Redis for BullMQ');
        isUsingInMemoryQueue = false;
      });

      bullQueue = new Queue('workflow-executions', { connection: redisConnection });
      bullWorker = new Worker(
        'workflow-executions',
        async (job) => {
          const { executionId, ownerId } = job.data;
          await orchestrator.runWorkflow(executionId, ownerId);
        },
        { connection: redisConnection }
      );
    } catch (e) {
      console.warn(`[ExecutionQueue] Redis initialization failed (${e.message}). Using in-memory execution queue.`);
      isUsingInMemoryQueue = true;
    }
  } else {
    isUsingInMemoryQueue = true;
  }
}

async function addExecutionJob({ executionId, ownerId }) {
  if (isUsingInMemoryQueue || !bullQueue) {
    inMemoryQueue.push({ executionId, ownerId });
    return { id: `mem_${Date.now()}`, inMemory: true };
  }

  try {
    const job = await bullQueue.add('execute-workflow', { executionId, ownerId }, {
      attempts: 1,
      removeOnComplete: true,
    });
    return { id: job.id, inMemory: false };
  } catch (err) {
    console.warn(`[ExecutionQueue] BullMQ dispatch failed (${err.message}). Falling back to in-memory processing.`);
    inMemoryQueue.push({ executionId, ownerId });
    return { id: `mem_fallback_${Date.now()}`, inMemory: true };
  }
}

module.exports = {
  initExecutionQueue,
  addExecutionJob,
  isUsingInMemoryQueue: () => isUsingInMemoryQueue,
};
