use serde::{Deserialize, Serialize};
use ts_rs::TS;
use std::collections::HashMap;

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct AgentDefinition {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub agent_type: AgentType,
    pub is_preset: bool,
    pub config: AgentConfig,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[ts(export)]
pub enum AgentType {
    Researcher,
    Writer,
    Analyst,
    Evaluator,
    Custom,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct AgentConfig {
    pub system_prompt: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub model_id: String,
    pub provider_id: String,
    pub tools: Vec<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateAgentRequest {
    pub name: String,
    pub description: Option<String>,
    pub agent_type: AgentType,
    pub config: AgentConfig,
}
