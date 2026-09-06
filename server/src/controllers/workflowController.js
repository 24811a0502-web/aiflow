const workflowService = require('../services/workflowService');

class WorkflowController {
  async getDashboard(req, res, next) {
    try {
      const stats = await workflowService.getDashboardStats(req.user.id);
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { search, status, tag, page, limit } = req.query;
      const result = await workflowService.listWorkflows(req.user.id, { search, status, tag, page, limit });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const workflow = await workflowService.createWorkflow(req.user.id, req.body);
      return res.status(201).json({ success: true, message: 'Workflow created', data: { workflow } });
    } catch (error) {
      next(error);
    }
  }

  async generate(req, res, next) {
    try {
      const { prompt } = req.body;
      const result = await workflowService.generateWorkflow(req.user.id, prompt);
      return res.status(200).json({
        success: true,
        message: 'Workflow generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.user.id, req.params.id);
      return res.status(200).json({ success: true, data: { workflow } });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const workflow = await workflowService.updateWorkflow(req.user.id, req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Workflow updated', data: { workflow } });
    } catch (error) {
      next(error);
    }
  }

  async duplicate(req, res, next) {
    try {
      const workflow = await workflowService.duplicateWorkflow(req.user.id, req.params.id);
      return res.status(201).json({ success: true, message: 'Workflow duplicated', data: { workflow } });
    } catch (error) {
      next(error);
    }
  }

  async execute(req, res, next) {
    try {
      const { inputs } = req.body;
      const execution = await workflowService.executeWorkflow(req.user.id, req.params.id, inputs);
      return res.status(202).json({
        success: true,
        message: 'Workflow execution queued',
        data: { execution },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await workflowService.deleteWorkflow(req.user.id, req.params.id);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowController();
