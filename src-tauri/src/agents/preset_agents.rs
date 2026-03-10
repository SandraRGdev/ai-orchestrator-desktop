use crate::models::agent_definition::{AgentDefinition, AgentType, AgentConfig};

pub fn get_preset_agents() -> Vec<AgentDefinition> {
    let now = chrono::Utc::now().to_rfc3339();
    vec![
        AgentDefinition {
            id: "preset-researcher".to_string(),
            name: "Investigador".to_string(),
            description: Some("Realiza investigación profunda sobre cualquier tema".to_string()),
            agent_type: AgentType::Researcher,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "Eres un asistente de investigación. Realiza una investigación profunda y bien estructurada sobre el tema indicado. Incluye citas y fuentes confiables.".to_string(),
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
            name: "Redactor".to_string(),
            description: Some("Crea contenido bien redactado sobre cualquier tema".to_string()),
            agent_type: AgentType::Writer,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "Eres un redactor profesional. Crea contenido claro, atractivo y bien estructurado según los requisitos.".to_string(),
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
            name: "Analista".to_string(),
            description: Some("Analiza datos y aporta conclusiones".to_string()),
            agent_type: AgentType::Analyst,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "Eres un analista de datos. Analiza la información proporcionada y extrae conclusiones, patrones y recomendaciones útiles.".to_string(),
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
            name: "Evaluador".to_string(),
            description: Some("Evalúa y selecciona la mejor respuesta".to_string()),
            agent_type: AgentType::Evaluator,
            is_preset: true,
            config: AgentConfig {
                system_prompt: "Eres un evaluador. Revisa las opciones proporcionadas y selecciona la mejor respuesta en función de calidad, precisión y relevancia. Explica tu elección.".to_string(),
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
