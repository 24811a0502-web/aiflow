const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const orchestrator = require('../agents/orchestrator');

class ExecutionService {
  async listExecutions(ownerId, { workflowId, status, page = 1, limit = 20 } = {}) {
    const workflows = await Workflow.find({ owner: ownerId });
    const userWorkflowIds = new Set(workflows.map((w) => String(w._id || w.id)));

    let all = await Execution.find({});
    all = all.filter((e) => userWorkflowIds.has(String(e.workflowId)));

    if (workflowId) {
      all = all.filter((e) => String(e.workflowId) === String(workflowId));
    }
    if (status && status !== 'all') {
      all = all.filter((e) => e.status === status);
    }

    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return {
      executions: paginated,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getExecutionById(ownerId, id) {
    const execution = await Execution.findById(id);
    if (!execution) {
      const err = new Error('Execution not found');
      err.status = 404;
      throw err;
    }

    // Verify ownership via workflow
    const workflow = await Workflow.findById(execution.workflowId);
    if (!workflow || String(workflow.owner) !== String(ownerId)) {
      const err = new Error('Execution not accessible');
      err.status = 403;
      throw err;
    }

    return execution;
  }

  async getExecutionTimeline(ownerId, id) {
    await this.getExecutionById(ownerId, id);
    const logs = await ExecutionLog.find({ executionId: id });
    logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return logs;
  }

  async pauseExecution(ownerId, id) {
    await this.getExecutionById(ownerId, id);
    const paused = orchestrator.pauseExecution(id);
    return { success: paused, message: paused ? 'Pause signal sent to orchestrator' : 'Run was not actively running' };
  }

  async resumeExecution(ownerId, id) {
    await this.getExecutionById(ownerId, id);
    const resumed = orchestrator.resumeExecution(id);
    return { success: resumed, message: resumed ? 'Resume signal sent to orchestrator' : 'Run was not paused' };
  }

  async cancelExecution(ownerId, id) {
    await this.getExecutionById(ownerId, id);
    const cancelled = orchestrator.cancelExecution(id);
    return { success: cancelled, message: cancelled ? 'Cancel signal sent to orchestrator' : 'Run was not running' };
  }
}

module.exports = new ExecutionService();
