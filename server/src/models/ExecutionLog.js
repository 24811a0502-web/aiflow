const mongoose = require('mongoose');
const { createModel } = require('./modelAdapter');

const executionLogSchema = new mongoose.Schema(
  {
    executionId: { type: mongoose.Schema.Types.Mixed, required: true },
    workflowId: { type: mongoose.Schema.Types.Mixed, required: true },
    nodeId: { type: String, default: null },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MongooseExecutionLog = mongoose.models.ExecutionLog || mongoose.model('ExecutionLog', executionLogSchema);
const ExecutionLog = createModel('executionLogs', MongooseExecutionLog);

module.exports = ExecutionLog;
