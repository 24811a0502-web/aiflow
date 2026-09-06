const integrationService = require('../services/integrationService');
const aiService = require('../services/aiService');

/**
 * Execution Agent: Pure agent responsible for executing individual node logic
 * via integrationService or aiService.
 */
class ExecutionAgent {
  async executeNode(node, ownerId, executionContext = {}) {
    const { type, data = {} } = node;
    const action = data.action || 'run';
    const params = { ...data.params };

    // Resolve parameter templating from executionContext if applicable
    const resolvedParams = this.resolveParameters(params, executionContext);

    let output = null;

    switch (type) {
      case 'trigger':
        output = {
          success: true,
          triggeredAt: new Date().toISOString(),
          type: data.triggerType || 'manual',
          input: resolvedParams,
        };
        break;

      case 'ai_prompt':
        output = await aiService.executeAIPromptNode(resolvedParams, executionContext);
        break;

      case 'gmail':
        output = await integrationService.executeIntegrationNode(
          ownerId,
          'gmail',
          action === 'run' ? 'sendEmail' : action,
          resolvedParams
        );
        break;

      case 'slack':
        output = await integrationService.executeIntegrationNode(
          ownerId,
          'slack',
          action === 'run' ? 'postMessage' : action,
          resolvedParams
        );
        break;

      case 'discord':
        output = await integrationService.executeIntegrationNode(
          ownerId,
          'discord',
          action === 'run' ? 'postMessage' : action,
          resolvedParams
        );
        break;

      case 'google-sheets':
        output = await integrationService.executeIntegrationNode(
          ownerId,
          'google-sheets',
          action === 'run' ? 'appendRow' : action,
          resolvedParams
        );
        break;

      case 'condition':
        // Evaluate condition expression
        const pass = Boolean(resolvedParams.condition ?? true);
        output = {
          success: true,
          conditionMet: pass,
          evaluated: resolvedParams,
        };
        break;

      default:
        output = {
          success: true,
          message: `Executed generic node type: ${type}`,
          data: resolvedParams,
        };
    }

    return {
      agent: 'execution',
      nodeId: node.id,
      nodeType: type,
      action,
      output,
    };
  }

  resolveParameters(params, context) {
    const resolved = { ...params };
    for (const key of Object.keys(resolved)) {
      if (typeof resolved[key] === 'string' && resolved[key].includes('{{') && resolved[key].includes('}}')) {
        for (const [ctxNodeId, ctxData] of Object.entries(context)) {
          resolved[key] = resolved[key].replace(`{{${ctxNodeId}.summary}}`, ctxData?.analysis || 'processed');
          resolved[key] = resolved[key].replace(`{{${ctxNodeId}.output}}`, JSON.stringify(ctxData));
        }
      }
    }
    return resolved;
  }
}

module.exports = new ExecutionAgent();
