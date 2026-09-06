const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', (req, res, next) => workflowController.getDashboard(req, res, next));
router.get('/', (req, res, next) => workflowController.list(req, res, next));

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Workflow name is required')],
  validate,
  (req, res, next) => workflowController.create(req, res, next)
);

router.post(
  '/generate',
  [body('prompt').trim().notEmpty().withMessage('Prompt is required for workflow generation')],
  validate,
  (req, res, next) => workflowController.generate(req, res, next)
);

router.get('/:id', (req, res, next) => workflowController.getById(req, res, next));
router.put('/:id', (req, res, next) => workflowController.update(req, res, next));
router.post('/:id/duplicate', (req, res, next) => workflowController.duplicate(req, res, next));
router.post('/:id/execute', (req, res, next) => workflowController.execute(req, res, next));
router.delete('/:id', (req, res, next) => workflowController.delete(req, res, next));

module.exports = router;
