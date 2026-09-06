/**
 * Validation Agent: Verifies that execution outputs satisfy structural integrity
 * and required fields.
 */
class ValidationAgent {
  async validate(node, executionResult) {
    const { nodeId, nodeType, output } = executionResult;
    const issues = [];

    if (!output) {
      return {
        agent: 'validation',
        nodeId,
        isValid: false,
        errorType: 'MISSING_FIELDS',
        message: `Node ${nodeId} produced null or undefined output.`,
      };
    }

    if (output.success === false) {
      return {
        agent: 'validation',
        nodeId,
        isValid: false,
        errorType: 'API_FAILURE',
        message: output.error || output.message || `Node ${nodeId} returned unsuccessful status.`,
      };
    }

    // Type specific validations
    if (nodeType === 'gmail' && !output.messageId && !output.messages) {
      issues.push('Missing messageId in Gmail output');
    }
    if (nodeType === 'slack' && !output.ts && !output.channels) {
      issues.push('Missing timestamp/channel response in Slack output');
    }
    if (nodeType === 'google-sheets' && output.appendedRows === undefined && !output.values) {
      issues.push('Missing rows or values confirmation in Sheets output');
    }

    const isValid = issues.length === 0;

    return {
      agent: 'validation',
      nodeId,
      isValid,
      errorType: isValid ? null : 'MISSING_FIELDS',
      issues,
      message: isValid
        ? `Output validation passed for node ${nodeId} (${nodeType}).`
        : `Validation warnings: ${issues.join('; ')}`,
    };
  }
}

module.exports = new ValidationAgent();
