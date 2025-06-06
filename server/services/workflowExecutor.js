
const resolveTokens = require('../utils/resolveTokens');
const integrationRegistry = require('../utils/integrationRegistry');

class WorkflowExecutor {
  constructor() {
    this.runningWorkflows = new Map();
  }

  async executeWorkflow(workflow, triggerPayload = {}) {
    const executionId = `${workflow._id}_${Date.now()}`;
    
    console.log(`🚀 Starting workflow execution: ${workflow.name} (${executionId})`);
    
    this.runningWorkflows.set(executionId, {
      workflowId: workflow._id,
      status: 'running',
      startTime: new Date(),
      currentStep: 0
    });

    try {
      const context = {
        workflow: workflow.name,
        trigger: triggerPayload,
        execution_id: executionId,
        ...triggerPayload // Include all trigger data for token resolution
      };

      const results = [];
      
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        console.log(`📝 Executing step ${i + 1}/${workflow.steps.length}: ${step.type}`);
        
        this.runningWorkflows.get(executionId).currentStep = i;
        
        try {
          const result = await this.executeStep(step, context);
          results.push({
            step: i + 1,
            type: step.type,
            status: 'success',
            result
          });

          // Add step result to context for future steps
          context[`step_${i + 1}_result`] = result;
          
        } catch (stepError) {
          console.error(`❌ Step ${i + 1} failed:`, stepError.message);
          results.push({
            step: i + 1,
            type: step.type,
            status: 'error',
            error: stepError.message
          });
          
          // Stop execution on error
          break;
        }
      }

      this.runningWorkflows.set(executionId, {
        ...this.runningWorkflows.get(executionId),
        status: 'completed',
        endTime: new Date(),
        results
      });

      console.log(`✅ Workflow completed: ${workflow.name}`);
      return results;

    } catch (error) {
      console.error(`💥 Workflow execution failed: ${workflow.name}`, error);
      
      this.runningWorkflows.set(executionId, {
        ...this.runningWorkflows.get(executionId),
        status: 'failed',
        endTime: new Date(),
        error: error.message
      });
      
      throw error;
    }
  }

  async executeStep(step, context) {
    const { type, integration, action, config } = step;
    
    // Resolve tokens in config
    const resolvedConfig = resolveTokens(config || {}, context);
    
    console.log(`🔧 Resolved config:`, resolvedConfig);

    // Handle different step types
    if (integration && action) {
      return await this.executeIntegrationAction(integration, action, resolvedConfig);
    } else {
      return await this.executeBasicStep(type, resolvedConfig);
    }
  }

  async executeIntegrationAction(integration, action, config) {
    console.log(`🔌 Executing ${integration}.${action}`);
    
    try {
      const integrationHandler = integrationRegistry.getIntegration(integration);
      if (!integrationHandler) {
        throw new Error(`Integration ${integration} not found`);
      }

      const actionHandler = integrationHandler.actions[action];
      if (!actionHandler) {
        throw new Error(`Action ${action} not found in ${integration}`);
      }

      return await actionHandler(config);
      
    } catch (error) {
      console.error(`❌ Integration action failed: ${integration}.${action}`, error);
      throw error;
    }
  }

  async executeBasicStep(type, config) {
    switch (type) {
      case 'delay':
        const delayMs = parseInt(config.delay || 1000);
        console.log(`⏳ Delaying for ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return { delayed: delayMs };

      case 'log':
        const message = config.message || 'Log step executed';
        console.log(`📄 Log: ${message}`);
        return { logged: message };

      case 'webhook':
        console.log(`🪝 Sending webhook to ${config.url}`);
        // In a real implementation, you'd make an HTTP request here
        return { webhook_sent: config.url };

      default:
        throw new Error(`Unknown step type: ${type}`);
    }
  }

  getExecutionStatus(executionId) {
    return this.runningWorkflows.get(executionId);
  }

  getAllRunningWorkflows() {
    return Array.from(this.runningWorkflows.entries()).map(([id, data]) => ({
      executionId: id,
      ...data
    }));
  }
}

module.exports = new WorkflowExecutor();
