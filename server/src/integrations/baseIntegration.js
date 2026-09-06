/**
 * BaseIntegration defines the interface that all third-party tool integrations must implement.
 */
class BaseIntegration {
  constructor(providerName) {
    if (this.constructor === BaseIntegration) {
      throw new Error('BaseIntegration is an abstract class and cannot be instantiated directly.');
    }
    this.providerName = providerName;
  }

  /**
   * Test connection health and credentials
   * @param {Object} credentials Decrypted credentials and configuration
   * @returns {Promise<{ isConnected: boolean, message?: string }>}
   */
  async testConnection(credentials) {
    throw new Error(`testConnection() not implemented in ${this.providerName}`);
  }

  /**
   * Execute an integration action (e.g. sendEmail, postMessage, appendRow)
   * @param {string} action
   * @param {Object} params
   * @param {Object} credentials
   * @returns {Promise<Object>} Execution result data
   */
  async executeAction(action, params, credentials) {
    throw new Error(`executeAction() not implemented in ${this.providerName}`);
  }

  /**
   * Refresh credentials if expired
   * @param {Object} credentials
   * @returns {Promise<Object>}
   */
  async refreshCredentials(credentials) {
    return credentials;
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} state
   * @returns {string}
   */
  getOAuthUrl(state) {
    return '';
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code
   * @returns {Promise<{ accessToken: string, refreshToken: string, expiresAt: Date }>}
   */
  async exchangeCodeForTokens(code) {
    throw new Error(`exchangeCodeForTokens() not implemented in ${this.providerName}`);
  }
}

module.exports = BaseIntegration;
