/**
 * Recovery Agent: Classifies execution errors into discrete taxonomy:
 * MISSING_FIELDS | API_FAILURE | AUTH_EXPIRED | RATE_LIMIT | TRANSIENT
 * and decides between retry_with_backoff and escalate.
 */
class RecoveryAgent {
  constructor() {
    this.MAX_RETRIES = 3;
    this.BASE_BACKOFF_MS = 1000;
  }

  classifyError(error, validationResult = null) {
    if (validationResult && validationResult.errorType) {
      return validationResult.errorType;
    }

    const message = (error?.message || '').toLowerCase();
    const code = error?.code || '';

    if (code === 'AUTH_EXPIRED' || message.includes('auth expired') || message.includes('token expired') || message.includes('invalid credentials')) {
      return 'AUTH_EXPIRED';
    }
    if (code === 'INTEGRATION_NOT_CONNECTED' || message.includes('not connected')) {
      return 'AUTH_EXPIRED';
    }
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    if (message.includes('missing') || message.includes('required field')) {
      return 'MISSING_FIELDS';
    }
    if (message.includes('timeout') || message.includes('econnreset') || message.includes('network') || message.includes('503')) {
      return 'TRANSIENT';
    }

    return 'API_FAILURE';
  }

  evaluateRecovery(error, retryCount = 0, validationResult = null) {
    const classification = this.classifyError(error, validationResult);

    // Decision Logic
    if (classification === 'AUTH_EXPIRED') {
      return {
        agent: 'recovery',
        classification,
        action: 'escalate',
        backoffMs: 0,
        reason: 'Authentication token is invalid or expired. Manual operator reconnection required.',
        shouldRetry: false,
      };
    }

    if (classification === 'MISSING_FIELDS') {
      return {
        agent: 'recovery',
        classification,
        action: 'escalate',
        backoffMs: 0,
        reason: 'Essential workflow fields missing from step payload. Requires schema correction.',
        shouldRetry: false,
      };
    }

    // Recoverable transient or rate limit failures with backoff
    if ((classification === 'TRANSIENT' || classification === 'RATE_LIMIT') && retryCount < this.MAX_RETRIES) {
      const backoffMs = this.BASE_BACKOFF_MS * Math.pow(2, retryCount);
      return {
        agent: 'recovery',
        classification,
        action: 'retry_with_backoff',
        backoffMs,
        retryCount: retryCount + 1,
        maxRetries: this.MAX_RETRIES,
        reason: `Encountered ${classification}. Scheduling automatic retry ${retryCount + 1}/${this.MAX_RETRIES} after ${backoffMs}ms.`,
        shouldRetry: true,
      };
    }

    // Default: Escalate if retries exhausted or generic API failure
    return {
      agent: 'recovery',
      classification,
      action: 'escalate',
      backoffMs: 0,
      reason: retryCount >= this.MAX_RETRIES
        ? `Exhausted maximum ${this.MAX_RETRIES} retry attempts for ${classification}.`
        : `Unrecoverable API Failure: ${error?.message || 'Operation halted.'}`,
      shouldRetry: false,
    };
  }
}

module.exports = new RecoveryAgent();
