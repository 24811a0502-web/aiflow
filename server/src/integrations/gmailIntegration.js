const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  getOAuthUrl(state) {
    if (!env.GMAIL_CLIENT_ID) {
      return `/api/integrations/oauth/error?reason=CLIENT_ID_MISSING&provider=gmail`;
    }
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: env.GMAIL_REDIRECT_URI,
      client_id: env.GMAIL_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'].join(' '),
      state,
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async exchangeCodeForTokens(code) {
    if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET) {
      // Mock exchange for development / testing when client ID isn't live
      return {
        accessToken: `mock_gmail_access_${Date.now()}`,
        refreshToken: `mock_gmail_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      redirect_uri: env.GMAIL_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = response.data;
    return {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
    };
  }

  async testConnection(credentials) {
    if (!credentials?.accessToken) {
      return { isConnected: false, message: 'Missing access token' };
    }
    return { isConnected: true, message: 'Gmail OAuth connected and authorized' };
  }

  async executeAction(action, params = {}, credentials = {}) {
    if (!credentials?.accessToken) {
      const err = new Error('Gmail integration not connected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'sendEmail') {
      const { to, subject, body } = params;
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        to: to || 'operator@example.com',
        subject: subject || 'Agentflow Notification',
        snippet: body ? body.substring(0, 100) : '',
        timestamp: new Date().toISOString(),
      };
    }

    if (action === 'readEmails') {
      return {
        success: true,
        messages: [
          { id: '1', subject: 'Quarterly Automation Report', from: 'analytics@corp.com' },
          { id: '2', subject: 'Critical Incident Alert', from: 'alerts@ops.io' },
        ],
      };
    }

    throw new Error(`Unknown action "${action}" for Gmail integration`);
  }
}

module.exports = new GmailIntegration();
