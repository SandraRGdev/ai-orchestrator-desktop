use crate::models::{
    agent_definition::AgentDefinition,
    workflow::{Workflow, WorkflowNode, FlowType},
    workflow_execution::{WorkflowResult, NodeResult},
};
use crate::providers::trait_definition::{PromptRequest, Message as ProviderMessage, MessageRole, ModelProvider};
use std::sync::Arc;
use std::collections::{HashMap, VecDeque};
use uuid::Uuid;

pub struct AgentExecutor {
    providers: Vec<Arc<dyn ModelProvider + Send + Sync>>,
    agents: Vec<AgentDefinition>,
}

impl AgentExecutor {
    pub fn new() -> Self {
        Self {
            providers: Vec::new(),
            agents: Vec::new(),
        }
    }

    pub fn register_provider(&mut self, provider: Arc<dyn ModelProvider + Send + Sync>) {
        self.providers.push(provider);
    }

    pub fn register_agent(&mut self, agent: AgentDefinition) {
        self.agents.push(agent);
    }

    pub fn clear_runtime(&mut self) {
        self.providers.clear();
        self.agents.clear();
    }

    pub fn providers_len(&self) -> usize {
        self.providers.len()
    }

    pub async fn execute_workflow(&self, workflow: &Workflow, input: String)
        -> Result<WorkflowResult, ExecutionError>
    {
        match workflow.flow_type {
            FlowType::Sequential => self.execute_sequential(workflow, input).await,
            FlowType::Parallel => self.execute_parallel(workflow, input).await,
            FlowType::Evaluator => self.execute_evaluator(workflow, input).await,
        }
    }

    async fn execute_sequential(&self, workflow: &Workflow, mut input: String)
        -> Result<WorkflowResult, ExecutionError>
    {
        let mut node_results = Vec::new();

        let sorted_nodes = self.topological_sort(workflow)?;

        for node in sorted_nodes {
            let agent = self.agents.iter()
                .find(|a| a.id == node.agent_id)
                .ok_or(ExecutionError::AgentNotFound(node.agent_id.clone()))?;

            let result = self.execute_agent(agent, input.clone()).await?;
            input = result.output.clone();
            node_results.push(result);
        }

        Ok(WorkflowResult {
            node_results,
            final_output: input,
        })
    }

    async fn execute_parallel(&self, workflow: &Workflow, input: String)
        -> Result<WorkflowResult, ExecutionError>
    {
        let mut tasks = Vec::new();

        for node in &workflow.nodes {
            let agent = self.agents.iter()
                .find(|a| a.id == node.agent_id)
                .ok_or(ExecutionError::AgentNotFound(node.agent_id.clone()))?
                .clone();

            let providers = self.providers.clone();
            let input_clone = input.clone();
            let node_id = node.id.clone();

            tasks.push(tokio::spawn(async move {
                Self::execute_agent_with_providers(&agent, &providers, input_clone, node_id).await
            }));
        }

        let results = futures::future::join_all(tasks)
            .await
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| ExecutionError::JoinError(e.to_string()))?
            .into_iter()
            .collect::<Result<Vec<_>, _>>()?;

        let combined_output = results.iter()
            .map(|r| format!("{}: {}", r.node_id, r.output))
            .collect::<Vec<_>>()
            .join("\n\n");

        Ok(WorkflowResult {
            node_results: results,
            final_output: combined_output,
        })
    }

    async fn execute_evaluator(&self, workflow: &Workflow, input: String)
        -> Result<WorkflowResult, ExecutionError>
    {
        if workflow.nodes.is_empty() {
            return Err(ExecutionError::InvalidWorkflow);
        }

        let parallel_result = self.execute_parallel(workflow, input.clone()).await?;

        let evaluator_node = workflow.nodes.last()
            .ok_or(ExecutionError::InvalidWorkflow)?;

        let evaluator_agent = self.agents.iter()
            .find(|a| a.id == evaluator_node.agent_id)
            .ok_or(ExecutionError::AgentNotFound(evaluator_node.agent_id.clone()))?;

        let aggregated = parallel_result.node_results
            .iter()
            .map(|r| format!("Agent {}: {}", r.agent_id, r.output))
            .collect::<Vec<_>>()
            .join("\n\n");

        let evaluator_prompt = format!(
            "Evaluate these responses:\n\n{}\n\nProvide the best response.",
            aggregated
        );

        let final_result = self.execute_agent(evaluator_agent, evaluator_prompt).await?;

        Ok(WorkflowResult {
            node_results: parallel_result.node_results,
            final_output: final_result.output,
        })
    }

    async fn execute_agent(&self, agent: &AgentDefinition, input: String)
        -> Result<NodeResult, ExecutionError>
    {
        Self::execute_agent_with_providers(
            agent,
            &self.providers,
            input,
            Uuid::new_v4().to_string(),
        ).await
    }

    async fn execute_agent_with_providers(
        agent: &AgentDefinition,
        providers: &[Arc<dyn ModelProvider + Send + Sync>],
        input: String,
        node_id: String,
    ) -> Result<NodeResult, ExecutionError> {
        let provider = Self::resolve_provider(agent, providers)
            .ok_or(ExecutionError::ProviderNotFound(agent.config.provider_id.clone()))?;

        let start = std::time::Instant::now();
        let model_id = Self::resolve_model_id(provider.provider_id(), &agent.config.provider_id, &agent.config.model_id);

        let request = PromptRequest {
            model: model_id,
            messages: vec![
                ProviderMessage {
                    role: MessageRole::System,
                    content: agent.config.system_prompt.clone(),
                },
                ProviderMessage {
                    role: MessageRole::User,
                    content: input,
                },
            ],
            temperature: agent.config.temperature,
            max_tokens: agent.config.max_tokens,
            stream: Some(false),
        };

        let response = provider.send_prompt(request).await
            .map_err(|e| ExecutionError::ProviderError(agent.config.provider_id.clone(), e.to_string()))?;

        let latency = start.elapsed().as_millis() as u64;

        Ok(NodeResult {
            node_id,
            agent_id: agent.id.clone(),
            output: response.content,
            latency_ms: latency,
            tokens_used: response.usage.total_tokens,
        })
    }

    fn resolve_provider<'a>(
        agent: &AgentDefinition,
        providers: &'a [Arc<dyn ModelProvider + Send + Sync>],
    ) -> Option<&'a Arc<dyn ModelProvider + Send + Sync>> {
        providers
            .iter()
            .find(|p| p.provider_id() == agent.config.provider_id)
            // OpenRouter can route many model families, so use it as a smart fallback.
            .or_else(|| providers.iter().find(|p| p.provider_id() == "openrouter"))
            .or_else(|| providers.first())
    }

    fn resolve_model_id(provider_id: &str, configured_provider_id: &str, model_id: &str) -> String {
        if provider_id != "openrouter" || model_id.contains('/') {
            return model_id.to_string();
        }

        let prefix = match configured_provider_id {
            "openai" => "openai",
            "anthropic" => "anthropic",
            "google" => "google",
            "groq" => "meta-llama",
            "openrouter" => return model_id.to_string(),
            _ => {
                if model_id.starts_with("claude-") {
                    "anthropic"
                } else if model_id.starts_with("gemini-") {
                    "google"
                } else if model_id.starts_with("gpt-") || model_id.starts_with("o1-") {
                    "openai"
                } else {
                    return model_id.to_string();
                }
            }
        };

        format!("{}/{}", prefix, model_id)
    }

    fn topological_sort(&self, workflow: &Workflow) -> Result<Vec<WorkflowNode>, ExecutionError> {
        let mut sorted = Vec::new();
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut adjacency: HashMap<String, Vec<String>> = HashMap::new();

        for node in &workflow.nodes {
            in_degree.insert(node.id.clone(), 0);
            adjacency.entry(node.id.clone()).or_default();
        }

        for node in &workflow.nodes {
            let degree = node.dependencies.len();
            in_degree.insert(node.id.clone(), degree);

            for dependency in &node.dependencies {
                if !in_degree.contains_key(dependency) {
                    return Err(ExecutionError::InvalidWorkflow);
                }
                adjacency.entry(dependency.clone()).or_default().push(node.id.clone());
            }
        }

        let mut queue: VecDeque<String> = in_degree.iter()
            .filter(|(_, &degree)| degree == 0)
            .map(|(id, _)| id.clone())
            .collect();

        while let Some(node_id) = queue.pop_front() {
            if let Some(node) = workflow.nodes.iter().find(|n| n.id == node_id) {
                sorted.push(node.clone());
            }

            if let Some(dependents) = adjacency.get(&node_id) {
                for dependent_id in dependents {
                    if let Some(degree) = in_degree.get_mut(dependent_id) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push_back(dependent_id.clone());
                        }
                    }
                }
            }
        }

        if sorted.len() != workflow.nodes.len() {
            return Err(ExecutionError::InvalidWorkflow);
        }

        Ok(sorted)
    }
}

impl Default for AgentExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ExecutionError {
    #[error("Agente no encontrado: {0}")]
    AgentNotFound(String),

    #[error("Proveedor no encontrado: {0}")]
    ProviderNotFound(String),

    #[error("Error del proveedor {0}: {1}")]
    ProviderError(String, String),

    #[error("Flujo inválido")]
    InvalidWorkflow,

    #[error("Error de ejecución paralela: {0}")]
    JoinError(String),
}

impl serde::Serialize for ExecutionError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
