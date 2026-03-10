import { invoke } from '@tauri-apps/api/core';
import type {
  AgentDefinition,
  CreateAgentRequest,
  Workflow,
  CreateWorkflowRequest,
  WorkflowExecution,
} from '../stores/agent-atom';

export const DEMO_MODE = false;

// Demo agent responses
const DEMO_AGENT_RESPONSES: Record<string, string> = {
  'Researcher': "🔬 **Salida del Agente Investigador**\n\nDespués de investigar a fondo este tema, aquí están mis hallazgos:\n\n**Descubrimientos clave:**\n- Varias fuentes confiables respaldan este enfoque\n- El consenso del sector apoya esta dirección\n- Estudios recientes muestran resultados prometedores\n\n**Referencias:**\n1. Fuente académica sobre el tema (2023)\n2. Informe de análisis de industria\n3. Documentación de consenso experto\n\n**Recomendación:** continuar con este enfoque según la evidencia actual.",
  'Writer': "✍️ **Salida del Agente Redactor**\n\nAquí tienes una versión pulida basada en tu solicitud:\n\n---\n\nEn un entorno que evoluciona rápidamente, la capacidad de adaptarse e innovar es clave. Las organizaciones que abrazan el cambio y fomentan la creatividad lideran sus sectores.\n\nLa clave está en equilibrar visión estratégica con ejecución práctica. Al alinear recursos y mantener una comunicación clara, los equipos logran resultados sobresalientes.\n\n---\n\nEste texto busca captar la atención y comunicar el mensaje de forma clara y efectiva.",
  'Analyst': "📊 **Salida del Agente Analista**\n\n**Resumen de análisis de datos:**\n\nCon la información proporcionada, este es mi análisis:\n\n**Tendencias identificadas:**\n• Trayectoria al alza en métricas clave\n• Patrones estacionales con comportamiento cíclico\n• Puntos anómalos que requieren revisión\n\n**Insights clave:**\n1. Los impulsores principales son factores X e Y\n2. Correlación de 0.78, relación fuerte\n3. Un valor atípico en Q3 debe revisarse\n\n**Recomendaciones:**\n- Priorizar áreas de alto impacto\n- Monitorear patrones anómalos\n- Aplicar ajustes estacionales en pronósticos",
  'Evaluator': "⚖️ **Salida del Agente Evaluador**\n\n**Resumen de evaluación:**\n\nTras revisar todas las opciones, esta es mi evaluación:\n\n**Opción A:** Base técnica sólida y buena escalabilidad (Puntuación: 8/10)\n**Opción B:** Enfoque innovador, mayor riesgo (Puntuación: 7/10)\n**Opción C:** Conservadora pero fiable (Puntuación: 6/10)\n\n**Mejor elección: Opción A**\n\n**Motivo:**\n- Mejor equilibrio riesgo/beneficio\n- Historial probado\n- Alineación con objetivos\n- Viable con las restricciones actuales\n\nLas otras opciones tienen valor, pero la Opción A ofrece la ruta más sólida.",
};

async function getAgentResponse(agentName: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
  return DEMO_AGENT_RESPONSES[agentName] || DEMO_AGENT_RESPONSES['Analyst'];
}

// Demo preset agents
export const DEMO_PRESET_AGENTS: AgentDefinition[] = [
  {
    id: 'preset-researcher',
    name: 'Investigador',
    description: 'Realiza investigación profunda sobre cualquier tema',
    agent_type: 'Researcher',
    is_preset: true,
    config: {
      system_prompt: 'Eres un asistente de investigación.',
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
    name: 'Redactor',
    description: 'Crea contenido bien redactado',
    agent_type: 'Writer',
    is_preset: true,
    config: {
      system_prompt: 'Eres un redactor profesional.',
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
    name: 'Analista',
    description: 'Analiza datos y aporta conclusiones',
    agent_type: 'Analyst',
    is_preset: true,
    config: {
      system_prompt: 'Eres un analista de datos.',
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
    name: 'Evaluador',
    description: 'Evalúa y selecciona la mejor respuesta',
    agent_type: 'Evaluator',
    is_preset: true,
    config: {
      system_prompt: 'Eres un evaluador.',
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
    throw new Error('Modo demo: flujo no encontrado');
  }
  return await invoke('get_workflow', { id });
}

export async function deleteWorkflow(id: string): Promise<void> {
  if (DEMO_MODE) {
    return;
  }
  await invoke('delete_workflow', { id });
}

export async function updateWorkflow(id: string, req: CreateWorkflowRequest): Promise<Workflow> {
  if (DEMO_MODE) {
    return {
      id,
      name: req.name,
      description: req.description,
      flow_type: req.flow_type,
      nodes: req.nodes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return await invoke('update_workflow', { id, req });
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
        final_output: `✅ **Flujo completado**\n\nSe procesaron ${nodeResults.length} agentes correctamente.\n\n**Salida final:**\n${nodeResults[nodeResults.length - 1]?.output || 'Sin salida'}`,
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
    throw new Error('Modo demo: ejecución no encontrada');
  }
  return await invoke('get_workflow_execution', { id });
}

export async function listWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
  if (DEMO_MODE) {
    return [];
  }
  return await invoke('list_workflow_executions', { workflowId });
}
