pub mod conversation;
pub mod message;
pub mod comparison_session;
pub mod comparison_result;
pub mod agent_definition;
pub mod workflow;
pub mod workflow_execution;

pub use conversation::{Conversation, CreateConversation};
pub use message::{Message, CreateMessage, SendMessageRequest, MessageRole};
pub use comparison_session::{ComparisonSession, ComparisonRequest, ModelConfig, CreateComparisonSession};
pub use comparison_result::{ComparisonResult, CreateComparisonResult};
pub use agent_definition::{AgentDefinition, AgentType, AgentConfig, CreateAgentRequest};
pub use workflow::{FlowType, WorkflowNode, Workflow, CreateWorkflowRequest};
pub use workflow_execution::{ExecutionStatus, WorkflowExecution, WorkflowResult, NodeResult};
