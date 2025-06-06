
const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const workflowExecutor = require('../services/workflowExecutor');

// Webhook endpoint for external integrations to trigger workflows
router.post('/trigger/:integration/:triggerType', async (req, res) => {
  const { integration, triggerType } = req.params;
  const payload = req.body;

  console.log(`🪝 Webhook received: ${integration}.${triggerType}`);
  console.log(`📦 Payload:`, payload);

  try {
    // Extract orgId from payload or require it to be passed
    const orgId = payload.orgId || req.headers['x-org-id'];
    
    if (!orgId) {
      return res.status(400).json({ 
        message: 'Missing orgId in payload or X-Org-Id header' 
      });
    }

    // Find workflows that match this trigger
    const triggerKey = `${integration}.${triggerType}`;
    const workflows = await Workflow.find({
      orgId,
      'trigger.type': triggerType,
      'trigger.source': integration,
      status: 'active'
    });

    console.log(`🔍 Found ${workflows.length} matching workflows for ${triggerKey}`);

    if (workflows.length === 0) {
      return res.status(200).json({ 
        message: 'No active workflows found for this trigger',
        trigger: triggerKey 
      });
    }

    // Execute all matching workflows
    const executions = [];
    for (const workflow of workflows) {
      try {
        console.log(`🚀 Executing workflow: ${workflow.name}`);
        const result = await workflowExecutor.executeWorkflow(workflow, payload);
        executions.push({
          workflowId: workflow._id,
          workflowName: workflow.name,
          status: 'success',
          result
        });
      } catch (error) {
        console.error(`❌ Workflow execution failed: ${workflow.name}`, error);
        executions.push({
          workflowId: workflow._id,
          workflowName: workflow.name,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      message: `Processed ${workflows.length} workflows`,
      trigger: triggerKey,
      executions
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Manual trigger endpoint for testing
router.post('/manual/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const payload = req.body || {};

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    if (workflow.status !== 'active') {
      return res.status(400).json({ message: 'Workflow is not active' });
    }

    console.log(`🧪 Manual trigger for workflow: ${workflow.name}`);
    const result = await workflowExecutor.executeWorkflow(workflow, payload);

    res.json({
      message: 'Workflow executed successfully',
      workflowId,
      workflowName: workflow.name,
      result
    });

  } catch (error) {
    console.error('❌ Manual trigger error:', error);
    res.status(500).json({ 
      message: 'Execution failed',
      error: error.message 
    });
  }
});

// Get execution status
router.get('/execution/:executionId', (req, res) => {
  const { executionId } = req.params;
  const status = workflowExecutor.getExecutionStatus(executionId);
  
  if (!status) {
    return res.status(404).json({ message: 'Execution not found' });
  }

  res.json(status);
});

// Get all running workflows
router.get('/running', (req, res) => {
  const running = workflowExecutor.getAllRunningWorkflows();
  res.json({ running });
});

module.exports = router;
