use crate::models::{
    agent_definition::AgentDefinition,
    workflow::{Workflow, WorkflowNode, FlowType},
    workflow_execution::{WorkflowExecution, ExecutionStatus, WorkflowResult, NodeResult},
};
use crate::providers::trait_definition::{PromptRequest, Message as ProviderMessage, MessageRole, ModelProvider};
use std::sync::Arc;
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
        let provider = self.providers.iter()
            .find(|p| p.provider_id() == agent.config.provider_id)
            .ok_or(ExecutionError::ProviderNotFound(agent.config.provider_id.clone()))?;

        Self::execute_agent_with_providers(agent, &[provider.clone()], input, Uuid::new_v4().to_string()).await
    }

    async fn execute_agent_with_providers(
        agent: &AgentDefinition,
        providers: &[Arc<dyn ModelProvider + Send + Sync>],
        input: String,
        node_id: String,
    ) -> Result<NodeResult, ExecutionError> {
        let provider = providers.iter()
            .find(|p| p.provider_id() == agent.config.provider_id)
            .ok_or(ExecutionError::ProviderNotFound(agent.config.provider_id.clone()))?;

        let start = std::time::Instant::now();

        let request = PromptRequest {
            model: agent.config.model_id.clone(),
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

    fn topological_sort(&self, workflow: &Workflow) -> Result<Vec<WorkflowNode>, ExecutionError> {
        let mut sorted = Vec::new();
        let mut in_degree: std::collections::HashMap<String, usize> = std::collections::HashMap::new();

        for node in &workflow.nodes {
            in_degree.insert(node.id.clone(), 0);
        }

        for node in &workflow.nodes {
            for dep in &node.dependencies {
                *in_degree.entry(dep.clone()).or_insert(0) += 1;
            }
        }

        let mut queue: Vec<String> = in_degree.iter()
            .filter(|(_, &degree)| degree == 0)
            .map(|(id, _)| id.clone())
            .collect();

        while let Some(node_id) = queue.pop() {
            if let Some(node) = workflow.nodes.iter().find(|n| n.id == node_id) {
                sorted.push(node.clone());
            }

            for node in &workflow.nodes {
                if node.dependencies.contains(&node_id) {
                    if let Some(degree) = in_degree.get_mut(&node.id) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push(node.id.clone());
                        }
                    }
                }
            }
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
    #[error("Agent not found: {0}")]
    AgentNotFound(String),

    #[error("Provider not found: {0}")]
    ProviderNotFound(String),

    #[error("Provider {0} error: {1}")]
    ProviderError(String, String),

    #[error("Invalid workflow")]
    InvalidWorkflow,

    #[error("Join error: {0}")]
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
