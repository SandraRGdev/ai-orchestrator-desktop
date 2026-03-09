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
    <div className="flex flex-col h-screen bg-primary">
      <div className="border-b border-border-subtle px-6 py-4 flex gap-4 items-center bg-elevated">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">Multi-Agent Workflows</h1>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setView('builder')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200 ${
              view === 'builder'
                ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25'
                : 'bg-tertiary text-text-secondary hover:bg-border-default hover:text-text-primary'
            } focus:outline-none focus:ring-2 focus:ring-accent-primary/50`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            Build Workflow
          </button>
          <button
            onClick={() => setView('execute')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200 ${
              view === 'execute'
                ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25'
                : 'bg-tertiary text-text-secondary hover:bg-border-default hover:text-text-primary'
            } focus:outline-none focus:ring-2 focus:ring-accent-primary/50`}
            disabled={!selectedWorkflow}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Execute
          </button>
        </div>
      </div>

      {view === 'builder' ? (
        <div className="flex-1 overflow-auto p-6">
          <WorkflowBuilder />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {selectedWorkflow && (
            <>
              <div className="w-1/2 p-6 border-r border-border-subtle overflow-auto">
                <WorkflowBuilder />
              </div>
              <div className="w-1/2 p-6 overflow-auto bg-elevated">
                <ExecutionLog execution={currentExecution} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
