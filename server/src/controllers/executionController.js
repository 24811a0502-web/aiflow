const executionService = require('../services/executionService');

class ExecutionController {
  async list(req, res, next) {
    try {
      const { workflowId, status, page, limit } = req.query;
      const result = await executionService.listExecutions(req.user.id, { workflowId, status, page, limit });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const execution = await executionService.getExecutionById(req.user.id, req.params.id);
      return res.status(200).json({ success: true, data: { execution } });
    } catch (error) {
      next(error);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const timeline = await executionService.getExecutionTimeline(req.user.id, req.params.id);
      return res.status(200).json({ success: true, data: { timeline } });
    } catch (error) {
      next(error);
    }
  }

  async pause(req, res, next) {
    try {
      const result = await executionService.pauseExecution(req.user.id, req.params.id);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async resume(req, res, next) {
    try {
      const result = await executionService.resumeExecution(req.user.id, req.params.id);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const result = await executionService.cancelExecution(req.user.id, req.params.id);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExecutionController();
