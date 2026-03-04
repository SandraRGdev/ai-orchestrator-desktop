use crate::models::agent_definition::{AgentDefinition, AgentType, AgentConfig};

pub fn get_preset_agents() -> Vec<AgentDefinition> {
    let now = chrono::Utc::now().to_rfc3339();
    vec![
        AgentDefinition {
            id: "preset-researcher".to_string(),
            name: "Researcher".to_string(),
            description: Some("Conducts thorough research on any topic".to_string()),
            agent_type: AgentType::Researcher,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "You are a research assistant. Conduct thorough, well-structured research on the given topic. Provide citations and reference reliable sources.".to_string(),
                temperature: Some(0.3),
                max_tokens: Some(2000),
                model_id: "claude-3-5-sonnet-20241022".to_string(),
                provider_id: "anthropic".to_string(),
                tools: vec![],
                metadata: Default::default(),
            },
            created_at: now.clone(),
            updated_at: now.clone(),
        },
        AgentDefinition {
            id: "preset-writer".to_string(),
            name: "Writer".to_string(),
            description: Some("Creates well-written content on any subject".to_string()),
            agent_type: AgentType::Writer,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "You are a professional writer. Create clear, engaging, and well-structured content based on the requirements.".to_string(),
                temperature: Some(0.7),
                max_tokens: Some(2000),
                model_id: "gpt-4o".to_string(),
                provider_id: "openai".to_string(),
                tools: vec![],
                metadata: Default::default(),
            },
            created_at: now.clone(),
            updated_at: now.clone(),
        },
        AgentDefinition {
            id: "preset-analyst".to_string(),
            name: "Analyst".to_string(),
            description: Some("Analyzes data and provides insights".to_string()),
            agent_type: AgentType::Analyst,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "You are a data analyst. Analyze the provided information and extract meaningful insights, patterns, and recommendations.".to_string(),
                temperature: Some(0.2),
                max_tokens: Some(2000),
                model_id: "claude-3-5-sonnet-20241022".to_string(),
                provider_id: "anthropic".to_string(),
                tools: vec![],
                metadata: Default::default(),
            },
            created_at: now.clone(),
            updated_at: now.clone(),
        },
        AgentDefinition {
            id: "preset-evaluator".to_string(),
            name: "Evaluator".to_string(),
            description: Some("Evaluates and selects the best response".to_string()),
            agent_type: AgentType::Evaluator,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "You are an evaluator. Review the provided options and select the best response based on quality, accuracy, and relevance. Explain your choice.".to_string(),
                temperature: Some(0.3),
                max_tokens: Some(2000),
                model_id: "claude-3-5-sonnet-20241022".to_string(),
                provider_id: "anthropic".to_string(),
                tools: vec![],
                metadata: Default::default(),
            },
            created_at: now.clone(),
            updated_at: now,
        },
    ]
}
