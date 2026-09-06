const integrationService = require('../services/integrationService');

class IntegrationController {
  async list(req, res, next) {
    try {
      const integrations = await integrationService.listUserIntegrations(req.user.id);
      return res.status(200).json({ success: true, data: { integrations } });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const { provider } = req.query;
      if (provider) {
        const status = await integrationService.getIntegrationStatus(req.user.id, provider);
        return res.status(200).json({ success: true, data: status });
      }
      const all = await integrationService.listUserIntegrations(req.user.id);
      return res.status(200).json({ success: true, data: { integrations: all } });
    } catch (error) {
      next(error);
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const state = Buffer.from(JSON.stringify({ userId: req.user.id, provider, timestamp: Date.now() })).toString('base64');
      const url = await integrationService.getOAuthUrl(provider, state);
      return res.status(200).json({ success: true, data: { url, state } });
    } catch (error) {
      next(error);
    }
  }

  async handleOAuthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      let userId = req.user?.id;
      if (!userId && state) {
        try {
          const parsed = JSON.parse(Buffer.from(state, 'base64').toString());
          userId = parsed.userId;
        } catch (e) {
          // ignore
        }
      }

      if (!userId) {
        return res.redirect('/integrations?status=error&message=Missing+user+session');
      }

      await integrationService.handleOAuthCallback(provider, code, userId);
      return res.redirect(`/integrations?status=connected&provider=${provider}`);
    } catch (error) {
      return res.redirect(`/integrations?status=error&message=${encodeURIComponent(error.message)}`);
    }
  }

  async oauthError(req, res) {
    const { reason, provider } = req.query;
    return res.status(400).json({
      success: false,
      error: 'OAuth configuration error',
      details: reason || 'OAuth client configuration missing in environment',
      provider,
    });
  }

  async saveManual(req, res, next) {
    try {
      const { provider, accessToken, config } = req.body;
      const integration = await integrationService.saveManualCredentials(req.user.id, {
        provider,
        accessToken,
        config,
      });
      return res.status(200).json({
        success: true,
        message: `${provider} credentials configured successfully`,
        data: { integration },
      });
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await integrationService.disconnectIntegration(req.user.id, provider);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IntegrationController();
