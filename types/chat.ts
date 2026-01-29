// types/chat.ts - Complete type definitions for Chat module

// ============================================================================
// Agent Types
// ============================================================================

/** Available agent types in the multi-agent system */
export type AgentType = 'nova' | 'scout' | 'blueprint' | 'forge' | 'guardian' | 'conductor';

/** Agent information with personality and capabilities */
export interface AgentInfo {
    agent_type: AgentType;
    name: string;
    role: string;
    color: string;
    avatar_emoji: string;
    description: string;
    capabilities: string[];
    thinking_phrases: string[];
    greeting_phrases: string[];
    completion_phrases: string[];
    error_phrases: string[];
    handoff_phrases: Record<string, string[]>;
}

// ============================================================================
// Intent & Analysis Types
// ============================================================================

/** Task complexity level */
export type ComplexityLevel = 'low' | 'medium' | 'high';

/** Analyzed intent from user message */
export interface Intent {
    task_type: string;
    domains_affected: string[];
    complexity: ComplexityLevel;
    requires_context: boolean;
    key_entities: string[];
    action_verbs: string[];
}

// ============================================================================
// Plan Types
// ============================================================================

/** Action types for plan steps */
export type PlanAction = 'create' | 'modify' | 'delete';

/** Individual step in an execution plan */
export interface PlanStep {
    order: number;
    action: PlanAction;
    file: string;
    description: string;
}

/** Complete execution plan with steps */
export interface Plan {
    summary: string;
    steps: PlanStep[];
}

// ============================================================================
// Execution Types
// ============================================================================

/** Result of executing a single file operation */
export interface ExecutionResult {
    file: string;
    action: PlanAction;
    content: string;
    diff: string | null;
    success: boolean;
    error: string | null;
}

// ============================================================================
// Validation Types
// ============================================================================

/** Severity levels for validation issues */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** Individual validation issue found during code analysis */
export interface ValidationIssue {
    severity: ValidationSeverity;
    file: string;
    message: string;
    line: number;
    signature: string;
}

/** Complete validation result after code analysis */
export interface ValidationResult {
    score: number;
    approved: boolean;
    issues: ValidationIssue[];
    errors: string[];
    warnings: string[];
}

// ============================================================================
// Code Changes Types
// ============================================================================

/** Code changes with execution results and validation */
export interface CodeChanges {
    results: ExecutionResult[];
    validation: ValidationResult;
}

// ============================================================================
// Processing Data Types
// ============================================================================

/**
 * Processing data attached to assistant messages
 * Contains the full pipeline state from intent to validation
 */
export interface ProcessingData {
    intent?: Intent;
    plan?: Plan;
    execution_results?: ExecutionResult[];
    validation?: ValidationResult;
    events?: ChatSSEEvent[];
    success: boolean;
    error: string | null;
}

// ============================================================================
// Message Types
// ============================================================================

/** Role of a chat message sender */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Chat message with optional code changes and processing data */
export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    code_changes?: CodeChanges;
    processing_data?: ProcessingData;
    created_at: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

/** Conversation metadata and summary */
export interface Conversation {
    id: string;
    project_id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
    message_count: number;
    last_message: string;
}

/** Paginated list of conversations */
export interface ConversationList {
    conversations: Conversation[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
}

// ============================================================================
// Request Types
// ============================================================================

/** Request payload for sending a chat message */
export interface ChatRequest {
    message: string;
    conversation_id?: string;
    interactive_mode?: boolean;
    require_plan_approval?: boolean;
}

/** Request to approve or reject a plan */
export interface PlanApprovalRequest {
    conversation_id: string;
    message_id: string;
    approved: boolean;
    feedback?: string;
}

// ============================================================================
// SSE Event Types
// ============================================================================

/** All possible SSE event types for chat streaming */
export type ChatSSEEventType =
// Connection events
    | 'connected'
    // Analysis events
    | 'intent_analyzed'
    | 'context_retrieved'
    // Planning events
    | 'planning_started'
    | 'plan_created'
    | 'plan_ready'
    | 'plan_approved'
    // Execution events
    | 'step_started'
    | 'step_completed'
    | 'step_code_chunk'
    | 'execution_started'
    | 'execution_completed'
    // Validation events
    | 'validation_started'
    | 'validation_thinking'
    | 'validation_issue_found'
    | 'validation_result'
    // Streaming events
    | 'answer_chunk'
    // Agent events (interactive mode)
    | 'agent_thinking'
    | 'agent_message'
    | 'agent_handoff'
    | 'agent_state_change'
    // Completion events
    | 'complete'
    | 'error';

/** Base SSE event structure */
export interface ChatSSEEvent {
    type: ChatSSEEventType;
    data: Record<string, unknown>;
    timestamp?: string;
}

// ============================================================================
// SSE Event Data Types (Discriminated Union)
// ============================================================================

export interface SSEEventConnectedData {
    conversation_id: string;
    message_id: string;
    agent?: AgentInfo;
}

export interface SSEEventIntentAnalyzedData {
    intent: Intent;
}

export interface SSEEventContextRetrievedData {
    files_count: number;
    context_summary: string;
}

export interface SSEEventPlanningStartedData {
    message: string;
}

export interface SSEEventPlanCreatedData {
    plan: Plan;
}

export interface SSEEventPlanReadyData {
    plan: Plan;
    requires_approval: boolean;
}

export interface SSEEventPlanApprovedData {
    approved: boolean;
    feedback?: string;
}

export interface SSEEventStepStartedData {
    step: PlanStep;
    step_index: number;
    total_steps: number;
}

export interface SSEEventStepCompletedData {
    step: PlanStep;
    result: ExecutionResult;
    step_index: number;
}

export interface SSEEventStepCodeChunkData {
    step_index: number;
    chunk: string;
    chunk_index: number;
}

export interface SSEEventExecutionStartedData {
    total_steps: number;
}

export interface SSEEventExecutionCompletedData {
    results: ExecutionResult[];
    success: boolean;
}

export interface SSEEventValidationStartedData {
    message: string;
}

export interface SSEEventValidationThinkingData {
    thought: string;
}

export interface SSEEventValidationIssueFoundData {
    issue: ValidationIssue;
}

export interface SSEEventValidationResultData {
    validation: ValidationResult;
}

export interface SSEEventAnswerChunkData {
    chunk: string;
    chunk_index: number;
    accumulated_length: number;
}

export interface SSEEventAgentThinkingData {
    agent: AgentInfo;
    thought: string;
    progress?: number;
}

export interface SSEEventAgentMessageData {
    agent: AgentInfo;
    message: string;
}

export interface SSEEventAgentHandoffData {
    from_agent: AgentInfo;
    to_agent: AgentInfo;
    reason: string;
}

export interface SSEEventAgentStateChangeData {
    agent: AgentInfo;
    state: string;
    metadata?: Record<string, unknown>;
}

export interface SSEEventCompleteData {
    success: boolean;
    answer: string;
    plan?: Plan;
    execution_results?: ExecutionResult[];
    validation?: ValidationResult;
    error?: string;
    agent_timeline?: AgentTimelineEntry[];
}

export interface SSEEventErrorData {
    error: string;
    code?: string;
    recoverable?: boolean;
}

/** Discriminated union of all SSE events */
export type TypedChatSSEEvent =
    | { type: 'connected'; data: SSEEventConnectedData }
    | { type: 'intent_analyzed'; data: SSEEventIntentAnalyzedData }
    | { type: 'context_retrieved'; data: SSEEventContextRetrievedData }
    | { type: 'planning_started'; data: SSEEventPlanningStartedData }
    | { type: 'plan_created'; data: SSEEventPlanCreatedData }
    | { type: 'plan_ready'; data: SSEEventPlanReadyData }
    | { type: 'plan_approved'; data: SSEEventPlanApprovedData }
    | { type: 'step_started'; data: SSEEventStepStartedData }
    | { type: 'step_completed'; data: SSEEventStepCompletedData }
    | { type: 'step_code_chunk'; data: SSEEventStepCodeChunkData }
    | { type: 'execution_started'; data: SSEEventExecutionStartedData }
    | { type: 'execution_completed'; data: SSEEventExecutionCompletedData }
    | { type: 'validation_started'; data: SSEEventValidationStartedData }
    | { type: 'validation_thinking'; data: SSEEventValidationThinkingData }
    | { type: 'validation_issue_found'; data: SSEEventValidationIssueFoundData }
    | { type: 'validation_result'; data: SSEEventValidationResultData }
    | { type: 'answer_chunk'; data: SSEEventAnswerChunkData }
    | { type: 'agent_thinking'; data: SSEEventAgentThinkingData }
    | { type: 'agent_message'; data: SSEEventAgentMessageData }
    | { type: 'agent_handoff'; data: SSEEventAgentHandoffData }
    | { type: 'agent_state_change'; data: SSEEventAgentStateChangeData }
    | { type: 'complete'; data: SSEEventCompleteData }
    | { type: 'error'; data: SSEEventErrorData };

// ============================================================================
// Chat Status Types
// ============================================================================

/** Current status of the chat session */
export type ChatStatus =
    | 'idle'
    | 'connecting'
    | 'analyzing'
    | 'planning'
    | 'executing'
    | 'validating'
    | 'streaming'
    | 'awaiting_approval'
    | 'complete'
    | 'error';

// ============================================================================
// Agent Timeline Types
// ============================================================================

/** Entry in the agent activity timeline */
export interface AgentTimelineEntry {
    agent: AgentInfo;
    action: string;
    timestamp: string;
    duration_ms?: number;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Helper Constants
// ============================================================================

/** Agent color mapping */
export const AGENT_COLORS: Record<AgentType, string> = {
    nova: '#8B5CF6',      // Purple - Main orchestrator
    scout: '#10B981',     // Green - Context finder
    blueprint: '#3B82F6', // Blue - Planner
    forge: '#F59E0B',     // Amber - Code generator
    guardian: '#EF4444',  // Red - Validator
    conductor: '#EC4899', // Pink - Coordinator
};

/** Agent emoji mapping */
export const AGENT_EMOJIS: Record<AgentType, string> = {
    nova: '🌟',
    scout: '🔍',
    blueprint: '📐',
    forge: '⚒️',
    guardian: '🛡️',
    conductor: '🎭',
};

/** Status display labels */
export const STATUS_LABELS: Record<ChatStatus, string> = {
    idle: 'Ready',
    connecting: 'Connecting...',
    analyzing: 'Analyzing intent...',
    planning: 'Creating plan...',
    executing: 'Executing changes...',
    validating: 'Validating code...',
    streaming: 'Generating response...',
    awaiting_approval: 'Awaiting approval',
    complete: 'Complete',
    error: 'Error',
};

/** Severity colors for validation issues */
export const SEVERITY_COLORS: Record<ValidationSeverity, string> = {
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
};

/** Action icons for plan steps */
export const ACTION_ICONS: Record<PlanAction, string> = {
    create: '➕',
    modify: '✏️',
    delete: '🗑️',
};

// ============================================================================
// Helper Functions
// ============================================================================

/** Generate a unique ID for messages and conversations */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

/** Generate a timestamp-based ID */
export function generateTimestampId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/** Get agent color by type */
export function getAgentColor(agentType: AgentType): string {
    return AGENT_COLORS[agentType] || '#6B7280';
}

/** Get agent emoji by type */
export function getAgentEmoji(agentType: AgentType): string {
    return AGENT_EMOJIS[agentType] || '🤖';
}

/** Get status display label */
export function getStatusLabel(status: ChatStatus): string {
    return STATUS_LABELS[status] || status;
}

/** Get severity color */
export function getSeverityColor(severity: ValidationSeverity): string {
    return SEVERITY_COLORS[severity] || '#6B7280';
}

/** Get action icon */
export function getActionIcon(action: PlanAction): string {
    return ACTION_ICONS[action] || '•';
}

/** Check if status indicates active processing */
export function isProcessingStatus(status: ChatStatus): boolean {
    return ['connecting', 'analyzing', 'planning', 'executing', 'validating', 'streaming'].includes(status);
}

/** Check if status allows new messages */
export function canSendMessage(status: ChatStatus): boolean {
    return status === 'idle' || status === 'complete' || status === 'error';
}

/** Format timestamp for display */
export function formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Format relative time (e.g., "2 hours ago") */
export function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

/** Get file extension from path */
export function getFileExtension(path: string): string {
    return path.split('.').pop() || '';
}

/** Calculate plan complexity based on steps */
export function calculatePlanComplexity(plan: Plan): ComplexityLevel {
    const stepCount = plan.steps.length;
    const hasDeletes = plan.steps.some(s => s.action === 'delete');

    if (stepCount > 5 || hasDeletes) return 'high';
    if (stepCount > 2) return 'medium';
    return 'low';
}

/** Count issues by severity */
export function countIssuesBySeverity(issues: ValidationIssue[]): Record<ValidationSeverity, number> {
    return issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
    }, { error: 0, warning: 0, info: 0 } as Record<ValidationSeverity, number>);
}

/** Check if validation passed */
export function isValidationPassed(validation: ValidationResult): boolean {
    return validation.approved && validation.errors.length === 0;
}

/** Create an empty message */
export function createEmptyMessage(role: MessageRole): ChatMessage {
    return {
        id: generateId(),
        role,
        content: '',
        created_at: new Date().toISOString(),
    };
}

/** Create a user message */
export function createUserMessage(content: string): ChatMessage {
    return {
        id: generateId(),
        role: 'user',
        content,
        created_at: new Date().toISOString(),
    };
}

/** Create an assistant message */
export function createAssistantMessage(content: string, processingData?: ProcessingData): ChatMessage {
    return {
        id: generateId(),
        role: 'assistant',
        content,
        processing_data: processingData,
        created_at: new Date().toISOString(),
    };
}