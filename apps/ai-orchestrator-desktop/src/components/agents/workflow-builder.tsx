import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { useSetAtom } from 'jotai';
import {
  presetAgentsAtom,
  customAgentsAtom,
  selectedWorkflowAtom,
  workflowsAtom,
  type Workflow,
  type FlowType,
  type CreateWorkflowRequest,
} from '../../stores/agent-atom';
import { createWorkflow as saveWorkflow, listWorkflows as fetchWorkflows } from '../../services/agent-service';

interface WorkflowBuilderProps {
  onSave?: (workflow: Workflow) => void;
}

export function WorkflowBuilder({ onSave }: WorkflowBuilderProps) {
  const [presetAgents] = useAtom(presetAgentsAtom);
  const [customAgents] = useAtom(customAgentsAtom);
  const setSelectedWorkflow = useSetAtom(selectedWorkflowAtom);
  const setWorkflows = useAtom(workflowsAtom)[1];
  const [workflows, setLocalWorkflows] = useState<Workflow[]>([]);
  const [flowType, setFlowType] = useState<FlowType>('Sequential');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const allAgents = [...presetAgents, ...customAgents];

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const fetched = await fetchWorkflows();
      setLocalWorkflows(fetched);
      setWorkflows(fetched);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const handleSave = async () => {
    if (!workflowName || selectedAgents.length === 0) {
      return;
    }

    const nodes = selectedAgents.map((agentId, index) => ({
      id: `node-${Date.now()}-${index}`,
      agent_id: agentId,
      dependencies: index > 0 ? [`node-${Date.now()}-${index - 1}`] : [],
    }));

    const req: CreateWorkflowRequest = {
      name: workflowName,
      description: workflowDescription || null,
      flow_type: flowType,
      nodes,
    };

    try {
      const saved = await saveWorkflow(req);
      setLocalWorkflows([...workflows, saved]);
      setWorkflows([...workflows, saved]);
      setSelectedWorkflow(saved);
      onSave?.(saved);
      setSelectedWorkflowId(saved.id);
      setWorkflowName('');
      setWorkflowDescription('');
      setSelectedAgents([]);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflowId(workflow.id);
    setSelectedWorkflow(workflow);
    setFlowType(workflow.flow_type);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setSelectedAgents(workflow.nodes.map((n) => n.agent_id));
  };

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const flowTypeLabels: Record<FlowType, string> = {
    Sequential: 'Sequential - Run one after another',
    Parallel: 'Parallel - Run all at once',
    Evaluator: 'Evaluator - Run all, then evaluate',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Workflow Builder</h2>

        {workflows.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saved Workflows
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => handleSelectWorkflow(workflow)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedWorkflowId === workflow.id
                      ? 'bg-blue-100 border-blue-500 border'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{workflow.name}</div>
                  <div className="text-sm text-gray-500">{workflow.flow_type}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="My Research Workflow"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={2}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flow Type
            </label>
            <select
              value={flowType}
              onChange={(e) => setFlowType(e.target.value as FlowType)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Sequential">Sequential</option>
              <option value="Parallel">Parallel</option>
              <option value="Evaluator">Evaluator</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {flowTypeLabels[flowType]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Agents ({selectedAgents.length} selected)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
              {allAgents.map((agent) => (
                <label
                  key={agent.id}
                  className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAgents.includes(agent.id)}
                    onChange={() => handleAgentToggle(agent.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{agent.name}</div>
                    {agent.description && (
                      <div className="text-sm text-gray-500">{agent.description}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      {agent.is_preset ? 'Preset' : 'Custom'} • {agent.agent_type}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!workflowName || selectedAgents.length === 0}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
