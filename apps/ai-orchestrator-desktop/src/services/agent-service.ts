import { invoke } from '@tauri-apps/api/core';
import type {
  AgentDefinition,
  CreateAgentRequest,
  Workflow,
  CreateWorkflowRequest,
  WorkflowExecution,
} from '../stores/agent-atom';

export async function listPresetAgents(): Promise<AgentDefinition[]> {
  return await invoke('list_preset_agents');
}

export async function listAllAgents(): Promise<AgentDefinition[]> {
  return await invoke('list_all_agents');
}

export async function createCustomAgent(req: CreateAgentRequest): Promise<AgentDefinition> {
  return await invoke('create_custom_agent', { req });
}

export async function deleteAgent(id: string): Promise<void> {
  await invoke('delete_agent', { id });
}

export async function createWorkflow(req: CreateWorkflowRequest): Promise<Workflow> {
  return await invoke('create_workflow', { req });
}

export async function listWorkflows(): Promise<Workflow[]> {
  return await invoke('list_workflows');
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return await invoke('get_workflow', { id });
}

export async function deleteWorkflow(id: string): Promise<void> {
  await invoke('delete_workflow', { id });
}

export async function executeWorkflow(
  workflowId: string,
  inputPrompt: string
): Promise<WorkflowExecution> {
  return await invoke('execute_workflow', { workflowId, inputPrompt });
}

export async function getWorkflowExecution(id: string): Promise<WorkflowExecution> {
  return await invoke('get_workflow_execution', { id });
}

export async function listWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
  return await invoke('list_workflow_executions', { workflowId });
}
