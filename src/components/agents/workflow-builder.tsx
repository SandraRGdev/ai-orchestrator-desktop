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
import {
  createWorkflow as saveWorkflow,
  deleteWorkflow as removeWorkflow,
  listWorkflows as fetchWorkflows,
  updateWorkflow as editWorkflow,
} from '../../services/agent-service';

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmArmed, setDeleteConfirmArmed] = useState(false);

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

  const resetForm = () => {
    setSelectedWorkflowId(null);
    setWorkflowName('');
    setWorkflowDescription('');
    setSelectedAgents([]);
    setFlowType('Sequential');
  };

  const clearSelection = () => {
    resetForm();
    setSelectedWorkflow(null);
    setDeleteConfirmArmed(false);
  };

  const buildWorkflowRequest = (): CreateWorkflowRequest => {
    const baseId = Date.now();
    const nodeIds = selectedAgents.map((_, index) => `node-${baseId}-${index}`);
    const nodes = selectedAgents.map((agentId, index) => ({
      id: nodeIds[index],
      agent_id: agentId,
      dependencies: index > 0 ? [nodeIds[index - 1]] : [],
    }));

    return {
      name: workflowName,
      description: workflowDescription || null,
      flow_type: flowType,
      nodes,
    };
  };

  const handleSave = async () => {
    if (!workflowName || selectedAgents.length === 0) {
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);

    const req = buildWorkflowRequest();

    try {
      if (selectedWorkflowId) {
        const updated = await editWorkflow(selectedWorkflowId, req);
        setLocalWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        setSelectedWorkflow(updated);
        onSave?.(updated);
        setSaveSuccess('Flujo actualizado correctamente.');
        return;
      }

      const saved = await saveWorkflow(req);
      setLocalWorkflows((prev) => [saved, ...prev]);
      setWorkflows((prev) => [saved, ...prev]);
      setSelectedWorkflow(saved);
      onSave?.(saved);
      setSelectedWorkflowId(saved.id);
      setSaveSuccess('Flujo guardado. Ya puedes ejecutarlo en la pestaña Ejecutar.');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setSaveError(error instanceof Error ? error.message : String(error));
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

  const handleDelete = async () => {
    const workflowId = selectedWorkflowId;

    if (!workflowId || isDeleting) {
      return;
    }

    if (!deleteConfirmArmed) {
      setDeleteConfirmArmed(true);
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);
    setIsDeleting(true);
    setDeleteConfirmArmed(false);

    try {
      await removeWorkflow(workflowId);
      const refreshed = await fetchWorkflows();
      setLocalWorkflows(refreshed);
      setWorkflows(refreshed);
      clearSelection();
      setSaveSuccess('Flujo eliminado correctamente.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaveError(`Error al eliminar (${workflowId}): ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const flowTypeLabels: Record<FlowType, string> = {
    Sequential: 'Secuencial - Ejecuta uno detrás de otro',
    Parallel: 'Paralelo - Ejecuta todos a la vez',
    Evaluator: 'Evaluador - Ejecuta todos y luego evalúa',
  };

  const flowTypeNames: Record<FlowType, string> = {
    Sequential: 'Secuencial',
    Parallel: 'Paralelo',
    Evaluator: 'Evaluador',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Constructor de flujos</h2>

        {workflows.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-text-primary">
                Flujos guardados
              </label>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-xs rounded-lg border border-border-subtle bg-tertiary text-text-secondary hover:text-text-primary hover:bg-border-default"
              >
                Nuevo flujo
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-border-subtle rounded-xl p-2 bg-surface/40">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => handleSelectWorkflow(workflow)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedWorkflowId === workflow.id
                      ? 'bg-accent-primary/20 border-accent-primary border'
                      : 'bg-tertiary hover:bg-border-default'
                  }`}
                >
                  <div className="font-medium">{workflow.name}</div>
                  <div className="text-sm text-text-secondary">{flowTypeNames[workflow.flow_type]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nombre del flujo
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Mi flujo de investigación"
              className="w-full px-3 py-2 border border-border-subtle bg-surface text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/50 placeholder:text-text-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe qué hace este flujo..."
              rows={2}
              className="w-full px-3 py-2 border border-border-subtle bg-surface text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/50 placeholder:text-text-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Tipo de flujo
            </label>
            <select
              value={flowType}
              onChange={(e) => setFlowType(e.target.value as FlowType)}
              className="w-full px-3 py-2 border border-border-subtle bg-surface text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/50 [&>option]:bg-tertiary [&>option]:text-text-primary"
            >
              <option value="Sequential">Secuencial</option>
              <option value="Parallel">Paralelo</option>
              <option value="Evaluator">Evaluador</option>
            </select>
            <p className="text-sm text-text-secondary mt-1">
              {flowTypeLabels[flowType]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Selecciona agentes ({selectedAgents.length} seleccionados)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-border-subtle rounded-xl p-3 bg-surface/40">
              {allAgents.map((agent) => (
                <label
                  key={agent.id}
                  className="flex items-start gap-3 p-2 hover:bg-tertiary rounded cursor-pointer"
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
                      <div className="text-sm text-text-secondary">{agent.description}</div>
                    )}
                    <div className="text-xs text-text-tertiary">
                      {agent.is_preset ? 'Predefinido' : 'Personalizado'} • {agent.agent_type}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!workflowName || selectedAgents.length === 0}
              className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary-hover disabled:bg-tertiary disabled:text-text-muted disabled:cursor-not-allowed"
            >
              {selectedWorkflowId ? 'Actualizar flujo' : 'Guardar flujo'}
            </button>
            {selectedWorkflowId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-accent-error/20 text-accent-error border border-accent-error/40 rounded-xl hover:bg-accent-error/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Eliminando...' : deleteConfirmArmed ? 'Confirmar eliminar' : 'Eliminar'}
              </button>
            )}
            {selectedWorkflowId && deleteConfirmArmed && !isDeleting && (
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmArmed(false);
                }}
                className="px-4 py-2 bg-tertiary text-text-secondary border border-border-subtle rounded-xl hover:bg-border-default hover:text-text-primary"
              >
                Cancelar
              </button>
            )}
          </div>
          {saveSuccess && (
            <div className="p-3 bg-accent-success/10 border border-accent-success/30 rounded-xl text-sm text-accent-success">
              {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className="p-3 bg-accent-error/10 border border-accent-error/30 rounded-xl text-sm text-accent-error">
              {saveError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
