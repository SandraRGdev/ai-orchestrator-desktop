import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  selectedWorkflowAtom,
  currentExecutionAtom,
  executionsAtom,
  type WorkflowExecution,
} from '../../stores/agent-atom';
import { executeWorkflow as runWorkflow } from '../../services/agent-service';

interface ExecutionLogProps {
  execution: WorkflowExecution | null;
}

export function ExecutionLog({ execution: propExecution }: ExecutionLogProps) {
  const [selectedWorkflow] = useAtom(selectedWorkflowAtom);
  const setCurrentExecution = useSetAtom(currentExecutionAtom);
  const [executions] = useAtom(executionsAtom);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflowExecutions = selectedWorkflow
    ? executions[selectedWorkflow.id] || []
    : [];

  const handleExecute = async () => {
    if (!selectedWorkflow || !inputPrompt.trim()) {
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const result = await runWorkflow(selectedWorkflow.id, inputPrompt);
      setCurrentExecution(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Execute Workflow</h2>

        {selectedWorkflow ? (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="font-medium">{selectedWorkflow.name}</div>
              <div className="text-sm text-text-secondary">
                {selectedWorkflow.flow_type} • {selectedWorkflow.nodes.length} agents
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Input Prompt
              </label>
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleExecute}
              disabled={!inputPrompt.trim() || isRunning}
              className="w-full px-4 py-2 bg-accent-success text-white rounded-xl hover:bg-accent-success disabled:bg-tertiary disabled:text-text-muted disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running...' : 'Execute Workflow'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-secondary">Select or create a workflow first.</p>
        )}
      </div>

      {propExecution && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Current Execution</h3>
          <div className="space-y-3">
            <div className="p-3 border rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Status</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    propExecution.status === 'Completed'
                      ? 'bg-accent-success/20 text-accent-success'
                      : propExecution.status === 'Failed'
                        ? 'bg-accent-error/20 text-accent-error'
                        : propExecution.status === 'Running'
                          ? 'bg-accent-secondary/20 text-accent-secondary'
                          : 'bg-tertiary text-text-primary'
                  }`}
                >
                  {propExecution.status}
                </span>
              </div>
              <div className="text-sm text-text-secondary">
                Started: {formatDate(propExecution.started_at)}
              </div>
              {propExecution.completed_at && (
                <div className="text-sm text-text-secondary">
                  Completed: {formatDate(propExecution.completed_at)}
                </div>
              )}
              {propExecution.error_message && (
                <div className="mt-2 p-2 bg-accent-error/10 border border-accent-error/30 rounded text-accent-error text-sm">
                  {propExecution.error_message}
                </div>
              )}
            </div>

            {propExecution.result && (
              <div>
                <h4 className="font-medium mb-2">Node Results</h4>
                <div className="space-y-2">
                  {propExecution.result.node_results.map((node, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Node {index + 1}</span>
                        <div className="text-sm text-text-secondary">
                          {node.tokens_used} tokens • {node.latency_ms}ms
                        </div>
                      </div>
                      <div className="text-sm text-text-primary whitespace-pre-wrap">
                        {node.output}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {propExecution.result && (
              <div>
                <h4 className="font-medium mb-2">Final Output</h4>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {propExecution.result.final_output}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {workflowExecutions.length > 0 && !propExecution && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Execution History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workflowExecutions.map((exec) => (
              <div key={exec.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{formatDate(exec.started_at)}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      exec.status === 'Completed'
                        ? 'bg-accent-success/20 text-accent-success'
                        : exec.status === 'Failed'
                          ? 'bg-accent-error/20 text-accent-error'
                          : 'bg-tertiary text-text-primary'
                    }`}
                  >
                    {exec.status}
                  </span>
                </div>
                {exec.result && (
                  <div className="text-sm text-text-secondary">
                    {exec.result.node_results.length} nodes •{' '}
                    {exec.result.node_results.reduce((sum, n) => sum + n.tokens_used, 0)}{' '}
                    total tokens
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
