import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  selectedWorkflowAtom,
  currentExecutionAtom,
  executionsAtom,
  type WorkflowExecution,
} from '../../stores/agent-atom';
import {
  executeWorkflow as runWorkflow,
  listWorkflowExecutions as fetchWorkflowExecutions,
} from '../../services/agent-service';

interface ExecutionLogProps {
  execution: WorkflowExecution | null;
}

export function ExecutionLog({ execution: propExecution }: ExecutionLogProps) {
  const [selectedWorkflow] = useAtom(selectedWorkflowAtom);
  const setCurrentExecution = useSetAtom(currentExecutionAtom);
  const [executions] = useAtom(executionsAtom);
  const setExecutions = useSetAtom(executionsAtom);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflowExecutions = selectedWorkflow
    ? executions[selectedWorkflow.id] || []
    : [];

  useEffect(() => {
    const loadExecutionHistory = async () => {
      if (!selectedWorkflow) {
        return;
      }

      try {
        const history = await fetchWorkflowExecutions(selectedWorkflow.id);
        setExecutions((prev) => ({
          ...prev,
          [selectedWorkflow.id]: history,
        }));
      } catch (err) {
        console.error('Failed to load workflow executions:', err);
      }
    };

    loadExecutionHistory();
  }, [selectedWorkflow, setExecutions]);

  const handleExecute = async () => {
    if (!selectedWorkflow || !inputPrompt.trim()) {
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const result = await runWorkflow(selectedWorkflow.id, inputPrompt);
      setCurrentExecution(result);
      setExecutions((prev) => ({
        ...prev,
        [selectedWorkflow.id]: [
          result,
          ...(prev[selectedWorkflow.id] || []).filter((item) => item.id !== result.id),
        ],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Running':
        return 'En ejecución';
      case 'Completed':
        return 'Completado';
      case 'Failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  const formatFlowType = (flowType: string) => {
    switch (flowType) {
      case 'Sequential':
        return 'Secuencial';
      case 'Parallel':
        return 'Paralelo';
      case 'Evaluator':
        return 'Evaluador';
      default:
        return flowType;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Ejecutar flujo</h2>
        <p className="text-sm text-text-secondary mb-4">
          Ejecuta un flujo guardado sobre un prompt. Cada agente procesa la salida del anterior (o en paralelo, según el tipo de flujo).
        </p>

        {selectedWorkflow ? (
          <div className="space-y-4">
            <div className="p-3 bg-tertiary border border-border-subtle rounded-xl">
              <div className="font-medium text-text-primary">{selectedWorkflow.name}</div>
              <div className="text-sm text-text-secondary">
                {formatFlowType(selectedWorkflow.flow_type)} • {selectedWorkflow.nodes.length} agentes
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Prompt de entrada
              </label>
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Escribe aquí tu prompt..."
                rows={4}
                className="w-full px-3 py-2 border border-border-subtle bg-surface text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/50 placeholder:text-text-secondary"
              />
            </div>

            <button
              onClick={handleExecute}
              disabled={!inputPrompt.trim() || isRunning}
              className="w-full px-4 py-2 bg-accent-success text-white rounded-xl hover:bg-accent-success disabled:bg-tertiary disabled:text-text-muted disabled:cursor-not-allowed"
            >
              {isRunning ? 'Ejecutando...' : 'Ejecutar flujo'}
            </button>

            {error && (
              <div className="p-3 bg-accent-error/10 border border-accent-error/30 rounded-xl text-accent-error text-sm break-words">
                {error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-secondary">Selecciona o crea un flujo primero.</p>
        )}
      </div>

      {propExecution && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Ejecución actual</h3>
          <div className="space-y-3">
            <div className="p-3 border border-border-subtle bg-surface/40 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Estado</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    propExecution.status === 'Completed'
                      ? 'bg-accent-success/20 text-accent-success'
                      : propExecution.status === 'Failed'
                        ? 'bg-accent-error/20 text-accent-error'
                        : propExecution.status === 'Running'
                          ? 'bg-accent-secondary/20 text-accent-secondary'
                          : 'bg-tertiary text-text-primary'
                    } font-medium`}
                >
                  {formatStatus(propExecution.status)}
                </span>
              </div>
              <div className="text-sm text-text-secondary">
                Inicio: {formatDate(propExecution.started_at)}
              </div>
              {propExecution.completed_at && (
                <div className="text-sm text-text-secondary">
                  Finalizado: {formatDate(propExecution.completed_at)}
                </div>
              )}
              {propExecution.error_message && (
                <div className="mt-2 p-2 bg-accent-error/10 border border-accent-error/30 rounded text-accent-error text-sm break-words">
                  {propExecution.error_message}
                </div>
              )}
            </div>

            {propExecution.result && (
              <div>
                <h4 className="font-medium mb-2">Resultados por nodo</h4>
                <div className="space-y-2">
                  {propExecution.result.node_results.map((node, index) => (
                    <div key={index} className="p-3 border border-border-subtle bg-surface/40 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Nodo {index + 1}</span>
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
                <h4 className="font-medium mb-2">Salida final</h4>
                <div className="p-3 bg-accent-success/10 border border-accent-success/30 rounded-xl">
                  <p className="text-sm whitespace-pre-wrap break-words text-text-primary">
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
          <h3 className="text-lg font-semibold mb-3">Historial de ejecuciones</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workflowExecutions.map((exec) => (
              <div key={exec.id} className="p-3 border border-border-subtle bg-surface/40 rounded-xl">
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
                    {formatStatus(exec.status)}
                  </span>
                </div>
                {exec.result && (
                  <div className="text-sm text-text-secondary">
                    {exec.result.node_results.length} nodos •{' '}
                    {exec.result.node_results.reduce((sum, n) => sum + n.tokens_used, 0)}{' '}
                    tokens totales
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
