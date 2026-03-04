import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { WorkflowBuilder } from './workflow-builder';
import { ExecutionLog } from './execution-log';
import {
  presetAgentsAtom,
  customAgentsAtom,
  selectedWorkflowAtom,
  currentExecutionAtom,
} from '../../stores/agent-atom';
import { listPresetAgents as fetchPresetAgents, listAllAgents as fetchAllAgents } from '../../services/agent-service';

export function AgentWorkspace() {
  const [view, setView] = useState<'builder' | 'execute'>('builder');
  const [, setPresetAgents] = useAtom(presetAgentsAtom);
  const [, setCustomAgents] = useAtom(customAgentsAtom);
  const [selectedWorkflow] = useAtom(selectedWorkflowAtom);
  const [currentExecution] = useAtom(currentExecutionAtom);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const [preset, custom] = await Promise.all([
        fetchPresetAgents(),
        fetchAllAgents(),
      ]);
      setPresetAgents(preset);
      setCustomAgents(custom.filter((a) => !a.is_preset));
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b px-4 py-2 flex gap-4 items-center bg-white">
        <h1 className="text-lg font-semibold">Multi-Agent Workflows</h1>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setView('builder')}
            className={`px-3 py-1 rounded ${
              view === 'builder'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Build Workflow
          </button>
          <button
            onClick={() => setView('execute')}
            className={`px-3 py-1 rounded ${
              view === 'execute'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            disabled={!selectedWorkflow}
          >
            Execute
          </button>
        </div>
      </div>

      {view === 'builder' ? (
        <WorkflowBuilder />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {selectedWorkflow && (
            <>
              <div className="w-1/2 p-4 border-r overflow-auto">
                <WorkflowBuilder />
              </div>
              <div className="w-1/2 p-4 overflow-auto">
                <ExecutionLog execution={currentExecution} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
