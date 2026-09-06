const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');

const router = express.Router();

// Public OAuth callback & error routes
router.get('/oauth/error', (req, res) => integrationController.oauthError(req, res));
router.get('/oauth/:provider/callback', (req, res, next) => integrationController.handleOAuthCallback(req, res, next));

// Authenticated integration routes
router.use(authenticate);

router.get('/', (req, res, next) => integrationController.list(req, res, next));
router.get('/status', (req, res, next) => integrationController.getStatus(req, res, next));
router.get('/oauth/:provider/start', (req, res, next) => integrationController.startOAuth(req, res, next));

router.post(
  '/',
  [
    body('provider').isIn(['gmail', 'slack', 'discord', 'google-sheets']).withMessage('Valid provider required'),
  ],
  validate,
  (req, res, next) => integrationController.saveManual(req, res, next)
);

router.delete('/:provider', (req, res, next) => integrationController.disconnect(req, res, next));

module.exports = router;
