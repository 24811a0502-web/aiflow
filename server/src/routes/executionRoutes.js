const express = require('express');
const executionController = require('../controllers/executionController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res, next) => executionController.list(req, res, next));
router.get('/:id', (req, res, next) => executionController.getById(req, res, next));
router.get('/:id/timeline', (req, res, next) => executionController.getTimeline(req, res, next));
router.post('/:id/pause', (req, res, next) => executionController.pause(req, res, next));
router.post('/:id/resume', (req, res, next) => executionController.resume(req, res, next));
router.post('/:id/cancel', (req, res, next) => executionController.cancel(req, res, next));

module.exports = router;
