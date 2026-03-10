use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[ts(export)]
pub enum FlowType {
    Sequential,
    Parallel,
    Evaluator,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct WorkflowNode {
    pub id: String,
    pub agent_id: String,
    pub dependencies: Vec<String>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub flow_type: FlowType,
    pub nodes: Vec<WorkflowNode>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub flow_type: FlowType,
    pub nodes: Vec<WorkflowNode>,
}
