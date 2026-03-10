use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[ts(export)]
pub enum ExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct WorkflowExecution {
    pub id: String,
    pub workflow_id: String,
    pub input_prompt: String,
    pub status: ExecutionStatus,
    pub result: Option<WorkflowResult>,
    pub error_message: Option<String>,
    pub started_at: String,
    pub completed_at: Option<String>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct WorkflowResult {
    pub node_results: Vec<NodeResult>,
    pub final_output: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct NodeResult {
    pub node_id: String,
    pub agent_id: String,
    pub output: String,
    pub latency_ms: u64,
    pub tokens_used: u32,
}
