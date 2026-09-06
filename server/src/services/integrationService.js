const Integration = require('../models/Integration');
const { encrypt, decrypt } = require('./cryptoService');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

class IntegrationService {
  constructor() {
    this.providers = {
      gmail: gmailIntegration,
      slack: slackIntegration,
      discord: discordIntegration,
      'google-sheets': googleSheetsIntegration,
    };
  }

  getProvider(providerName) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Integration provider "${providerName}" is not supported`);
    }
    return provider;
  }

  async listUserIntegrations(ownerId) {
    const list = await Integration.find({ owner: ownerId });
    const standardProviders = ['gmail', 'slack', 'discord', 'google-sheets'];

    return standardProviders.map((provider) => {
      const existing = list.find((item) => item.provider === provider);
      return {
        provider,
        isConnected: existing ? existing.isConnected : false,
        expiresAt: existing ? existing.expiresAt : null,
        scopes: existing ? existing.scopes : [],
        updatedAt: existing ? existing.updatedAt : null,
        hasConfig: existing ? Boolean(existing.config && Object.keys(existing.config).length) : false,
      };
    });
  }

  async getIntegrationStatus(ownerId, providerName) {
    const integration = await Integration.findOne({ owner: ownerId, provider: providerName });
    if (!integration || !integration.isConnected) {
      return { provider: providerName, isConnected: false, status: 'DISCONNECTED' };
    }

    if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
      return { provider: providerName, isConnected: false, status: 'AUTH_EXPIRED' };
    }

    return { provider: providerName, isConnected: true, status: 'HEALTHY' };
  }

  async getOAuthUrl(providerName, state) {
    const provider = this.getProvider(providerName);
    return provider.getOAuthUrl(state);
  }

  async handleOAuthCallback(providerName, code, ownerId) {
    const provider = this.getProvider(providerName);
    const tokenData = await provider.exchangeCodeForTokens(code);

    const encAccess = encrypt(tokenData.accessToken);
    const encRefresh = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null;

    let integration = await Integration.findOne({ owner: ownerId, provider: providerName });
    if (!integration) {
      integration = await Integration.create({
        owner: ownerId,
        provider: providerName,
        isConnected: true,
        encryptedTokens: {
          accessToken: encAccess.encrypted,
          refreshToken: encRefresh?.encrypted || null,
          iv: encAccess.iv,
          authTag: encAccess.authTag,
        },
        expiresAt: tokenData.expiresAt,
        scopes: [],
      });
    } else {
      integration = await Integration.findByIdAndUpdate(
        integration._id || integration.id,
        {
          isConnected: true,
          encryptedTokens: {
            accessToken: encAccess.encrypted,
            refreshToken: encRefresh?.encrypted || null,
            iv: encAccess.iv,
            authTag: encAccess.authTag,
          },
          expiresAt: tokenData.expiresAt,
        },
        { new: true }
      );
    }

    return integration;
  }

  async saveManualCredentials(ownerId, { provider: providerName, accessToken, config }) {
    this.getProvider(providerName);
    const encAccess = encrypt(accessToken || 'manual_configured_token');

    let integration = await Integration.findOne({ owner: ownerId, provider: providerName });
    if (!integration) {
      integration = await Integration.create({
        owner: ownerId,
        provider: providerName,
        isConnected: true,
        encryptedTokens: {
          accessToken: encAccess.encrypted,
          refreshToken: null,
          iv: encAccess.iv,
          authTag: encAccess.authTag,
        },
        config: config || {},
      });
    } else {
      integration = await Integration.findByIdAndUpdate(
        integration._id || integration.id,
        {
          isConnected: true,
          encryptedTokens: {
            accessToken: encAccess.encrypted,
            refreshToken: null,
            iv: encAccess.iv,
            authTag: encAccess.authTag,
          },
          config: config || {},
        },
        { new: true }
      );
    }
    return integration;
  }

  async disconnectIntegration(ownerId, providerName) {
    const integration = await Integration.findOne({ owner: ownerId, provider: providerName });
    if (integration) {
      await Integration.findByIdAndUpdate(integration._id || integration.id, {
        isConnected: false,
        encryptedTokens: { accessToken: null, refreshToken: null, iv: null, authTag: null },
      });
    }
    return { success: true, message: `${providerName} disconnected` };
  }

  async getDecryptedCredentials(ownerId, providerName) {
    const integration = await Integration.findOne({ owner: ownerId, provider: providerName });
    if (!integration || !integration.isConnected) {
      const err = new Error(`Integration "${providerName}" is not connected`);
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
      const err = new Error(`Authentication for "${providerName}" has expired`);
      err.code = 'AUTH_EXPIRED';
      throw err;
    }

    const { encryptedTokens, config } = integration;
    if (!encryptedTokens?.accessToken) {
      const err = new Error(`Credentials missing for "${providerName}"`);
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    const decryptedAccessToken = decrypt(
      encryptedTokens.accessToken,
      encryptedTokens.iv,
      encryptedTokens.authTag
    );

    return {
      accessToken: decryptedAccessToken,
      config: config || {},
    };
  }

  async executeIntegrationNode(ownerId, providerName, action, params) {
    const provider = this.getProvider(providerName);
    const credentials = await this.getDecryptedCredentials(ownerId, providerName);
    return await provider.executeAction(action, params, credentials);
  }
}

module.exports = new IntegrationService();
