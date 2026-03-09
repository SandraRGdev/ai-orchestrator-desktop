import { invoke } from '@tauri-apps/api/core';
import type {
  AgentDefinition,
  CreateAgentRequest,
  Workflow,
  CreateWorkflowRequest,
  WorkflowExecution,
} from '../stores/agent-atom';

export const DEMO_MODE = true;

// Demo agent responses
const DEMO_AGENT_RESPONSES: Record<string, string> = {
  'Researcher': "🔬 **Research Agent Output**\n\nAfter conducting thorough research on this topic, here are my findings:\n\n**Key Discoveries:**\n- Multiple credible sources confirm this approach\n- The consensus in the field supports this direction\n- Recent studies have shown promising results\n\n**References:**\n1. Academic source on this topic (2023)\n2. Industry analysis report\n3. Expert consensus documentation\n\n**Recommendation:** Proceed with this approach based on current evidence.",
  'Writer': "✍️ **Writer Agent Output**\n\nHere's a polished piece based on your request:\n\n---\n\nIn today's rapidly evolving landscape, the ability to adapt and innovate has become paramount. Organizations that embrace change and foster creativity are finding themselves at the forefront of their industries.\n\nThe key lies in balancing strategic vision with practical execution. By aligning resources effectively and maintaining clear communication channels, teams can achieve remarkable results.\n\n---\n\nThis piece aims to engage your audience while conveying the core message clearly and effectively.",
  'Analyst': "📊 **Analyst Agent Output**\n\n**Data Analysis Summary:**\n\nBased on the information provided, here's my analysis:\n\n**Trends Identified:**\n• Upward trajectory in key metrics\n• Seasonal patterns indicating cyclical behavior\n• Anomalous data points requiring investigation\n\n**Key Insights:**\n1. Primary drivers are X and Y factors\n2. Correlation coefficient of 0.78 suggests strong relationship\n3. Outlier in Q3 data needs review\n\n**Recommendations:**\n- Focus on high-impact areas identified\n- Monitor anomalous patterns\n- Consider seasonal adjustments in forecasting",
  'Evaluator': "⚖️ **Evaluator Agent Output**\n\n**Evaluation Summary:**\n\nAfter reviewing all options, here's my assessment:\n\n**Option A:** Strong technical foundation, good scalability (Score: 8/10)\n**Option B:** Innovative approach, higher risk (Score: 7/10)\n**Option C:** Conservative but reliable (Score: 6/10)\n\n**Best Choice: Option A**\n\n**Rationale:**\n- Best balance of risk and reward\n- Proven track record\n- Alignment with stated objectives\n- Feasible within given constraints\n\nThe other options have merit but Option A provides the optimal path forward.",
};

async function getAgentResponse(agentName: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
  return DEMO_AGENT_RESPONSES[agentName] || DEMO_AGENT_RESPONSES['Analyst'];
}

// Demo preset agents
export const DEMO_PRESET_AGENTS: AgentDefinition[] = [
  {
    id: 'preset-researcher',
    name: 'Researcher',
    description: 'Conducts thorough research on any topic',
    agent_type: 'Researcher',
    is_preset: true,
    config: {
      system_prompt: 'You are a research assistant.',
      temperature: 0.3,
      max_tokens: 2000,
      model_id: 'claude-3-5-sonnet-20241022',
      provider_id: 'demo-anthropic',
      tools: [],
      metadata: {},
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preset-writer',
    name: 'Writer',
    description: 'Creates well-written content',
    agent_type: 'Writer',
    is_preset: true,
    config: {
      system_prompt: 'You are a professional writer.',
      temperature: 0.7,
      max_tokens: 2000,
      model_id: 'gpt-4o',
      provider_id: 'demo-openai',
      tools: [],
      metadata: {},
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preset-analyst',
    name: 'Analyst',
    description: 'Analyzes data and provides insights',
    agent_type: 'Analyst',
    is_preset: true,
    config: {
      system_prompt: 'You are a data analyst.',
      temperature: 0.2,
      max_tokens: 2000,
      model_id: 'claude-3-5-sonnet-20241022',
      provider_id: 'demo-anthropic',
      tools: [],
      metadata: {},
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preset-evaluator',
    name: 'Evaluator',
    description: 'Evaluates and selects the best response',
    agent_type: 'Evaluator',
    is_preset: true,
    config: {
      system_prompt: 'You are an evaluator.',
      temperature: 0.3,
      max_tokens: 2000,
      model_id: 'claude-3-5-sonnet-20241022',
      provider_id: 'demo-anthropic',
      tools: [],
      metadata: {},
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listPresetAgents(): Promise<AgentDefinition[]> {
  if (DEMO_MODE) {
    return DEMO_PRESET_AGENTS;
  }
  return await invoke('list_preset_agents');
}

export async function listAllAgents(): Promise<AgentDefinition[]> {
  if (DEMO_MODE) {
    return DEMO_PRESET_AGENTS;
  }
  return await invoke('list_all_agents');
}

export async function createCustomAgent(req: CreateAgentRequest): Promise<AgentDefinition> {
  if (DEMO_MODE) {
    return {
      id: `custom-${Date.now()}`,
      name: req.name,
      description: req.description,
      agent_type: req.agent_type,
      is_preset: false,
      config: req.config,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return await invoke('create_custom_agent', { req });
}

export async function deleteAgent(id: string): Promise<void> {
  if (DEMO_MODE) {
    return;
  }
  await invoke('delete_agent', { id });
}

export async function createWorkflow(req: CreateWorkflowRequest): Promise<Workflow> {
  if (DEMO_MODE) {
    return {
      id: `workflow-${Date.now()}`,
      name: req.name,
      description: req.description,
      flow_type: req.flow_type,
      nodes: req.nodes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return await invoke('create_workflow', { req });
}

export async function listWorkflows(): Promise<Workflow[]> {
  if (DEMO_MODE) {
    return [];
  }
  return await invoke('list_workflows');
}

export async function getWorkflow(id: string): Promise<Workflow> {
  if (DEMO_MODE) {
    throw new Error('Demo mode: workflow not found');
  }
  return await invoke('get_workflow', { id });
}

export async function deleteWorkflow(id: string): Promise<void> {
  if (DEMO_MODE) {
    return;
  }
  await invoke('delete_workflow', { id });
}

export async function executeWorkflow(
  workflowId: string,
  inputPrompt: string
): Promise<WorkflowExecution> {
  if (DEMO_MODE) {
    // Simulate workflow execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get demo agents to simulate responses
    const agents = DEMO_PRESET_AGENTS;
    const nodeResults = await Promise.all(
      agents.slice(0, 3).map(async (agent, index) => ({
        node_id: `node-${index}`,
        agent_id: agent.id,
        output: await getAgentResponse(agent.name),
        latency_ms: 600 + Math.floor(Math.random() * 400),
        tokens_used: 100 + Math.floor(Math.random() * 200),
      }))
    );

    return {
      id: `exec-${Date.now()}`,
      workflow_id: workflowId,
      input_prompt: inputPrompt,
      status: 'Completed',
      result: {
        node_results: nodeResults,
        final_output: `✅ **Workflow Complete**\n\nProcessed ${nodeResults.length} agents successfully.\n\n**Final Output:**\n${nodeResults[nodeResults.length - 1]?.output || 'No output'}`,
      },
      error_message: null,
      started_at: new Date(Date.now() - 2000).toISOString(),
      completed_at: new Date().toISOString(),
    };
  }
  return await invoke('execute_workflow', { workflowId, inputPrompt });
}

export async function getWorkflowExecution(id: string): Promise<WorkflowExecution> {
  if (DEMO_MODE) {
    throw new Error('Demo mode: execution not found');
  }
  return await invoke('get_workflow_execution', { id });
}

export async function listWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
  if (DEMO_MODE) {
    return [];
  }
  return await invoke('list_workflow_executions', { workflowId });
}
