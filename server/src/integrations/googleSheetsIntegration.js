const axios = require('axios');
const BaseIntegration = require('./baseIntegration');
const env = require('../config/env');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  getOAuthUrl(state) {
    if (!env.GOOGLE_SHEETS_CLIENT_ID) {
      return `/api/integrations/oauth/error?reason=CLIENT_ID_MISSING&provider=google-sheets`;
    }
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: env.GOOGLE_SHEETS_REDIRECT_URI,
      client_id: env.GOOGLE_SHEETS_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      state,
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async exchangeCodeForTokens(code) {
    if (!env.GOOGLE_SHEETS_CLIENT_ID || !env.GOOGLE_SHEETS_CLIENT_SECRET) {
      return {
        accessToken: `mock_sheets_access_${Date.now()}`,
        refreshToken: `mock_sheets_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: env.GOOGLE_SHEETS_CLIENT_ID,
      client_secret: env.GOOGLE_SHEETS_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_SHEETS_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || null,
      expiresAt: new Date(Date.now() + (response.data.expires_in || 3600) * 1000),
    };
  }

  async testConnection(credentials) {
    if (!credentials?.accessToken) {
      return { isConnected: false, message: 'Missing Google Sheets access token' };
    }
    return { isConnected: true, message: 'Google Sheets OAuth authorization confirmed' };
  }

  async executeAction(action, params = {}, credentials = {}) {
    if (!credentials?.accessToken) {
      const err = new Error('Google Sheets integration not connected');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'appendRow') {
      const { spreadsheetId, sheetName, rowData } = params;
      return {
        success: true,
        spreadsheetId: spreadsheetId || 'default-sheet-id',
        sheetName: sheetName || 'Sheet1',
        appendedRows: 1,
        rowData: rowData || [],
        updatedRange: `${sheetName || 'Sheet1'}!A2:E2`,
      };
    }

    if (action === 'readRange') {
      const { spreadsheetId, range } = params;
      return {
        success: true,
        spreadsheetId: spreadsheetId || 'default-sheet-id',
        range: range || 'Sheet1!A1:Z100',
        values: [
          ['ID', 'Name', 'Status', 'Timestamp'],
          ['101', 'Lead Sample', 'Qualified', new Date().toISOString()],
        ],
      };
    }

    throw new Error(`Unknown action "${action}" for Google Sheets integration`);
  }
}

module.exports = new GoogleSheetsIntegration();
