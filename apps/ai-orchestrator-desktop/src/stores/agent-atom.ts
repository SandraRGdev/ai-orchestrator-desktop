import { atom } from 'jotai';

export interface AgentConfig {
  system_prompt: string;
  temperature?: number | null;
  max_tokens?: number | null;
  model_id: string;
  provider_id: string;
  tools: string[];
  metadata: Record<string, string>;
}

export type AgentType = 'Researcher' | 'Writer' | 'Analyst' | 'Evaluator' | 'Custom';

export interface AgentDefinition {
  id: string;
  name: string;
  description: string | null;
  agent_type: AgentType;
  is_preset: boolean;
  config: AgentConfig;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string | null;
  agent_type: AgentType;
  config: AgentConfig;
}

export type FlowType = 'Sequential' | 'Parallel' | 'Evaluator';

export interface WorkflowNode {
  id: string;
  agent_id: string;
  dependencies: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  flow_type: FlowType;
  nodes: WorkflowNode[];
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description: string | null;
  flow_type: FlowType;
  nodes: WorkflowNode[];
}

export type ExecutionStatus = 'Pending' | 'Running' | 'Completed' | 'Failed';

export interface NodeResult {
  node_id: string;
  agent_id: string;
  output: string;
  latency_ms: number;
  tokens_used: number;
}

export interface WorkflowResult {
  node_results: NodeResult[];
  final_output: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  input_prompt: string;
  status: ExecutionStatus;
  result: WorkflowResult | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Atoms for state management
export const presetAgentsAtom = atom<AgentDefinition[]>([]);
export const customAgentsAtom = atom<AgentDefinition[]>([]);
export const workflowsAtom = atom<Workflow[]>([]);
export const executionsAtom = atom<Record<string, WorkflowExecution[]>>({});
export const selectedWorkflowAtom = atom<Workflow | null>(null);
export const currentExecutionAtom = atom<WorkflowExecution | null>(null);
