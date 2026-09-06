const Execution = require('../models/Execution');
const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const { emitExecutionStatus } = require('../config/socket');

// Dynamic LangGraph check as required by spec
let langGraphStatus = 'not-installed';
try {
  require.resolve('@langchain/langgraph');
  langGraphStatus = 'available';
} catch (e) {
  langGraphStatus = 'not-installed';
}

class Orchestrator {
  constructor() {
    this.activeRunControllers = new Map(); // executionId -> { cancelled: boolean, paused: boolean, resumePromiseResolve: fn }
  }

  getLangGraphStatus() {
    return langGraphStatus;
  }

  pauseExecution(executionId) {
    const controller = this.activeRunControllers.get(String(executionId));
    if (controller) {
      controller.paused = true;
      return true;
    }
    return false;
  }

  resumeExecution(executionId) {
    const controller = this.activeRunControllers.get(String(executionId));
    if (controller && controller.paused) {
      controller.paused = false;
      if (controller.resumePromiseResolve) {
        controller.resumePromiseResolve();
        controller.resumePromiseResolve = null;
      }
      return true;
    }
    return false;
  }

  cancelExecution(executionId) {
    const controller = this.activeRunControllers.get(String(executionId));
    if (controller) {
      controller.cancelled = true;
      if (controller.resumePromiseResolve) {
        controller.resumePromiseResolve();
      }
      return true;
    }
    return false;
  }

  async runWorkflow(executionId, ownerId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const workflow = execution.workflowSnapshot;
    const workflowId = execution.workflowId;
    const startTime = Date.now();

    const controller = {
      cancelled: false,
      paused: false,
      resumePromiseResolve: null,
    };
    this.activeRunControllers.set(String(executionId), controller);

    try {
      // 1. Set RUNNING status
      await Execution.findByIdAndUpdate(executionId, {
        status: 'RUNNING',
        startTime: new Date(),
      });
      emitExecutionStatus(executionId, { status: 'RUNNING', executionId });

      await monitoringAgent.emitEvent({
        executionId,
        workflowId,
        agent: 'monitoring',
        level: 'info',
        message: `Execution initiated. Substrate LangGraph: ${langGraphStatus}.`,
        metadata: { langGraph: langGraphStatus },
      });

      // 2. Planner Agent: Determine execution order and confidence
      const plan = await plannerAgent.plan(workflow);
      await monitoringAgent.emitEvent({
        executionId,
        workflowId,
        agent: 'planner',
        level: 'info',
        message: plan.reasoning,
        metadata: {
          confidenceScore: plan.confidenceScore,
          totalSteps: plan.totalSteps,
          executionOrder: plan.executionOrder,
          cycleDetected: plan.cycleDetected,
        },
      });

      const executionContext = { ...execution.inputs };
      let currentRetryCount = 0;

      // 3. Sequential Node Execution Loop
      for (let i = 0; i < plan.orderedNodes.length; i++) {
        const node = plan.orderedNodes[i];

        // Check cancellation
        if (controller.cancelled) {
          await Execution.findByIdAndUpdate(executionId, {
            status: 'CANCELLED',
            endTime: new Date(),
            duration: Date.now() - startTime,
          });
          emitExecutionStatus(executionId, { status: 'CANCELLED', executionId });
          await monitoringAgent.emitEvent({
            executionId,
            workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: 'Execution cancelled by operator.',
          });
          return;
        }

        // Check paused state
        if (controller.paused) {
          await Execution.findByIdAndUpdate(executionId, {
            status: 'PAUSED',
            currentNode: node.id,
          });
          emitExecutionStatus(executionId, { status: 'PAUSED', executionId, currentNode: node.id });
          await monitoringAgent.emitEvent({
            executionId,
            workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution paused by operator before node ${node.data?.label || node.id}.`,
          });

          await new Promise((resolve) => {
            controller.resumePromiseResolve = resolve;
          });

          if (controller.cancelled) {
            await Execution.findByIdAndUpdate(executionId, {
              status: 'CANCELLED',
              endTime: new Date(),
              duration: Date.now() - startTime,
            });
            emitExecutionStatus(executionId, { status: 'CANCELLED', executionId });
            return;
          }

          await Execution.findByIdAndUpdate(executionId, { status: 'RUNNING' });
          emitExecutionStatus(executionId, { status: 'RUNNING', executionId });
        }

        // Update current node in execution doc
        await Execution.findByIdAndUpdate(executionId, { currentNode: node.id });

        let stepSuccess = false;
        let stepOutput = null;

        while (!stepSuccess) {
          try {
            // Execution Agent runs node
            const execResult = await executionAgent.executeNode(node, ownerId, executionContext);
            stepOutput = execResult.output;

            await monitoringAgent.emitEvent({
              executionId,
              workflowId,
              nodeId: node.id,
              agent: 'execution',
              level: 'info',
              message: `Executed node "${node.data?.label || node.id}" (${node.type}) successfully.`,
              metadata: { action: execResult.action, outputPreview: execResult.output },
            });

            // Validation Agent verifies output
            const validation = await validationAgent.validate(node, execResult);
            if (!validation.isValid) {
              await monitoringAgent.emitEvent({
                executionId,
                workflowId,
                nodeId: node.id,
                agent: 'validation',
                level: 'warning',
                message: validation.message,
                metadata: { issues: validation.issues, errorType: validation.errorType },
              });

              // Recovery evaluation for validation failure
              const recovery = recoveryAgent.evaluateRecovery(null, currentRetryCount, validation);
              await monitoringAgent.emitEvent({
                executionId,
                workflowId,
                nodeId: node.id,
                agent: 'recovery',
                level: recovery.shouldRetry ? 'warning' : 'error',
                message: recovery.reason,
                metadata: recovery,
              });

              if (recovery.shouldRetry) {
                currentRetryCount = recovery.retryCount;
                await Execution.findByIdAndUpdate(executionId, {
                  status: 'RETRYING',
                  retryCount: currentRetryCount,
                });
                emitExecutionStatus(executionId, { status: 'RETRYING', retryCount: currentRetryCount });
                await new Promise((r) => setTimeout(r, recovery.backoffMs));
                continue;
              } else {
                throw new Error(validation.message);
              }
            } else {
              await monitoringAgent.emitEvent({
                executionId,
                workflowId,
                nodeId: node.id,
                agent: 'validation',
                level: 'success',
                message: validation.message,
              });
              stepSuccess = true;
            }
          } catch (error) {
            // Recovery Agent classifies node execution failure
            const recovery = recoveryAgent.evaluateRecovery(error, currentRetryCount);
            await monitoringAgent.emitEvent({
              executionId,
              workflowId,
              nodeId: node.id,
              agent: 'recovery',
              level: recovery.shouldRetry ? 'warning' : 'error',
              message: recovery.reason,
              metadata: {
                classification: recovery.classification,
                action: recovery.action,
                backoffMs: recovery.backoffMs,
              },
            });

            if (recovery.shouldRetry) {
              currentRetryCount = recovery.retryCount;
              await Execution.findByIdAndUpdate(executionId, {
                status: 'RETRYING',
                retryCount: currentRetryCount,
              });
              emitExecutionStatus(executionId, { status: 'RETRYING', retryCount: currentRetryCount });
              await new Promise((r) => setTimeout(r, recovery.backoffMs));
            } else {
              // Escalate & fail execution
              await Execution.findByIdAndUpdate(executionId, {
                status: 'FAILED',
                endTime: new Date(),
                duration: Date.now() - startTime,
                error: {
                  message: error.message,
                  classification: recovery.classification,
                  failedAtNode: node.id,
                },
                retryCount: currentRetryCount,
              });
              emitExecutionStatus(executionId, { status: 'FAILED', executionId, error: error.message });

              await monitoringAgent.notifyUser({
                ownerId,
                workflowId,
                executionId,
                type: 'error',
                title: `Workflow Execution Failed: ${workflow.name}`,
                message: `Failed at node "${node.data?.label || node.id}": ${error.message}`,
              });
              return;
            }
          }
        }

        // Save output to context for next steps
        executionContext[node.id] = stepOutput;
      }

      // 4. All nodes completed successfully
      const duration = Date.now() - startTime;
      await Execution.findByIdAndUpdate(executionId, {
        status: 'COMPLETED',
        endTime: new Date(),
        duration,
        outputs: executionContext,
        currentNode: null,
      });
      emitExecutionStatus(executionId, { status: 'COMPLETED', executionId, duration });

      await monitoringAgent.emitEvent({
        executionId,
        workflowId,
        agent: 'monitoring',
        level: 'success',
        message: `Workflow completed successfully in ${duration}ms across all steps.`,
        metadata: { duration, totalNodes: plan.orderedNodes.length },
      });

      await monitoringAgent.notifyUser({
        ownerId,
        workflowId,
        executionId,
        type: 'success',
        title: `Workflow Run Completed: ${workflow.name}`,
        message: `Executed all ${plan.orderedNodes.length} steps in ${duration}ms.`,
      });
    } catch (unexpectedError) {
      await Execution.findByIdAndUpdate(executionId, {
        status: 'FAILED',
        endTime: new Date(),
        duration: Date.now() - startTime,
        error: { message: unexpectedError.message },
      });
      emitExecutionStatus(executionId, { status: 'FAILED', executionId, error: unexpectedError.message });
    } finally {
      this.activeRunControllers.delete(String(executionId));
    }
  }
}

module.exports = new Orchestrator();
