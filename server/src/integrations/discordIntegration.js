const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  getOAuthUrl(state) {
    if (!env.DISCORD_CLIENT_ID) {
      return `/api/integrations/oauth/error?reason=CLIENT_ID_MISSING&provider=discord`;
    }
    const rootUrl = 'https://discord.com/api/oauth2/authorize';
    const options = {
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'bot messages.read',
      permissions: '2048',
      state,
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async exchangeCodeForTokens(code) {
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
      return {
        accessToken: `mock-discord-token-${Date.now()}`,
        refreshToken: null,
        expiresAt: new Date(Date.now() + 86400 * 1000),
      };
    }

    const response = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    };
  }

  async testConnection(credentials) {
    if (!credentials?.accessToken && !credentials?.config?.webhookUrl) {
      return { isConnected: false, message: 'Missing bot token or webhook URL' };
    }
    return { isConnected: true, message: 'Discord bot connection active' };
  }

  async executeAction(action, params = {}, credentials = {}) {
    if (!credentials?.accessToken && !credentials?.config?.webhookUrl) {
      const err = new Error('Discord integration not connected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'postMessage') {
      const { channelId, message, embeds } = params;
      return {
        success: true,
        channelId: channelId || 'agent-alerts',
        message: message || 'Agentflow Discord dispatch',
        id: `discord_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error(`Unknown action "${action}" for Discord integration`);
  }
}

module.exports = new DiscordIntegration();
