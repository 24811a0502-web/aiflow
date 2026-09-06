const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const aiService = require('./aiService');
const { addExecutionJob } = require('../queues/executionQueue');

class WorkflowService {
  async createWorkflow(ownerId, data) {
    const workflow = await Workflow.create({
      name: data.name || 'Untitled Automation',
      description: data.description || '',
      owner: ownerId,
      status: data.status || 'draft',
      triggerConfig: data.triggerConfig || { type: 'manual', config: {} },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: 1,
      tags: data.tags || [],
    });
    return workflow;
  }

  async generateWorkflow(ownerId, prompt) {
    const generated = await aiService.generateWorkflowFromPrompt(prompt);
    const workflow = await Workflow.create({
      name: generated.name || 'AI Generated Automation',
      description: generated.description || `Generated from prompt: "${prompt.substring(0, 60)}"`,
      owner: ownerId,
      status: 'draft',
      triggerConfig: generated.triggerConfig || { type: 'manual', config: {} },
      nodes: generated.nodes || [],
      edges: generated.edges || [],
      version: 1,
      tags: generated.tags || ['ai-generated'],
    });

    return {
      workflow,
      generator: generated.generator || 'ai',
    };
  }

  async listWorkflows(ownerId, { search, status, tag, page = 1, limit = 20 } = {}) {
    let all = await Workflow.find({ owner: ownerId });
    if (search) {
      const q = search.toLowerCase();
      all = all.filter((w) => w.name?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q));
    }
    if (status && status !== 'all') {
      all = all.filter((w) => w.status === status);
    }
    if (tag) {
      all = all.filter((w) => w.tags?.includes(tag));
    }

    // Sort newest first
    all.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return {
      workflows: paginated,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getWorkflowById(ownerId, id) {
    const workflow = await Workflow.findById(id);
    if (!workflow || String(workflow.owner) !== String(ownerId)) {
      const err = new Error('Workflow not found');
      err.status = 404;
      throw err;
    }
    return workflow;
  }

  async updateWorkflow(ownerId, id, updateData) {
    const existing = await this.getWorkflowById(ownerId, id);
    const newVersion = (existing.version || 1) + 1;

    const updated = await Workflow.findByIdAndUpdate(
      id,
      {
        ...updateData,
        version: newVersion,
      },
      { new: true }
    );
    return updated;
  }

  async duplicateWorkflow(ownerId, id) {
    const existing = await this.getWorkflowById(ownerId, id);
    const clone = await Workflow.create({
      name: `${existing.name} (Copy)`,
      description: existing.description,
      owner: ownerId,
      status: 'draft',
      triggerConfig: existing.triggerConfig,
      nodes: existing.nodes,
      edges: existing.edges,
      version: 1,
      tags: existing.tags,
    });
    return clone;
  }

  async deleteWorkflow(ownerId, id) {
    await this.getWorkflowById(ownerId, id);
    await Workflow.findByIdAndDelete(id);
    return { success: true, message: 'Workflow deleted successfully' };
  }

  async executeWorkflow(ownerId, id, inputs = {}) {
    const workflow = await this.getWorkflowById(ownerId, id);

    // Create immutable runtime snapshot
    const execution = await Execution.create({
      workflowId: id,
      workflowSnapshot: {
        id: workflow._id || workflow.id,
        name: workflow.name,
        nodes: workflow.nodes,
        edges: workflow.edges,
        triggerConfig: workflow.triggerConfig,
        version: workflow.version,
      },
      status: 'PENDING',
      startTime: new Date(),
      inputs,
      outputs: {},
      retryCount: 0,
    });

    const executionId = execution._id || execution.id;
    await addExecutionJob({ executionId, ownerId });

    return execution;
  }

  async getDashboardStats(ownerId) {
    const workflows = await Workflow.find({ owner: ownerId });
    const executions = await Execution.find({}); // filtered by owner workflows

    const userWorkflowIds = new Set(workflows.map((w) => String(w._id || w.id)));
    const userExecutions = executions.filter((e) => userWorkflowIds.has(String(e.workflowId)));

    const activeCount = workflows.filter((w) => w.status === 'active').length;
    const completedExecutions = userExecutions.filter((e) => e.status === 'COMPLETED').length;
    const failedExecutions = userExecutions.filter((e) => e.status === 'FAILED').length;
    const totalExecutions = userExecutions.length;
    const successRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 100;

    // Recent 5 executions
    const recentExecutions = userExecutions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((e) => ({
        id: e._id || e.id,
        workflowId: e.workflowId,
        workflowName: e.workflowSnapshot?.name || 'Automation Run',
        status: e.status,
        duration: e.duration,
        startTime: e.startTime,
        retryCount: e.retryCount,
      }));

    return {
      metrics: {
        totalWorkflows: workflows.length,
        activeWorkflows: activeCount,
        totalExecutions,
        successRate,
        completedExecutions,
        failedExecutions,
      },
      recentExecutions,
    };
  }
}

module.exports = new WorkflowService();
