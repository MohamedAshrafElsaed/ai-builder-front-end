import { authService } from './auth';
import {
    ChatRequest,
    ChatMessage,
    Conversation,
    ConversationList,
    Plan,
    ExecutionResult,
    ValidationResult,
    AgentInfo,
    ChatSSEEvent,
    ChatSSEEventType,
    SSEEventCompleteData,
    SSEEventConnectedData,
    SSEEventIntentAnalyzedData,
    SSEEventPlanCreatedData,
    SSEEventPlanReadyData,
    SSEEventStepStartedData,
    SSEEventStepCompletedData,
    SSEEventStepCodeChunkData,
    SSEEventAnswerChunkData,
    SSEEventAgentThinkingData,
    SSEEventAgentMessageData,
    SSEEventAgentHandoffData,
    SSEEventValidationIssueFoundData,
    SSEEventValidationResultData,
    SSEEventErrorData,
} from '@/types/chat';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ============================================================================
// Headers
// ============================================================================

function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    const token = authService.getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function getSSEHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
    };
    const token = authService.getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// ============================================================================
// Response Types
// ============================================================================

/** Response from sync chat endpoint */
export interface SyncChatResponse {
    success: boolean;
    conversation_id: string;
    message_id: string;
    answer: string;
    plan?: Plan;
    execution_results?: ExecutionResult[];
    validation?: ValidationResult;
    error?: string;
}

/** Response from approve plan endpoint */
export interface ApprovePlanResponse {
    success: boolean;
    message: string;
    execution_results?: ExecutionResult[];
    validation?: ValidationResult;
    error?: string;
}

/** Request for plan approval */
export interface ApprovePlanRequest {
    conversation_id: string;
    message_id: string;
    approved: boolean;
    feedback?: string;
}

/** Response for conversation messages */
export interface ConversationMessagesResponse {
    conversation: Conversation;
    messages: ChatMessage[];
}

/** Response for agents endpoint */
export interface AgentsResponse {
    success: boolean;
    agents: AgentInfo[];
}

// ============================================================================
// Chat API
// ============================================================================

export const chatApi = {
    /**
     * Start streaming chat with project
     * Returns Response for SSE handling
     */
    async streamChat(
        projectId: string,
        request: ChatRequest,
        signal?: AbortSignal
    ): Promise<Response> {
        const response = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
            method: 'POST',
            headers: getSSEHeaders(),
            body: JSON.stringify(request),
            signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || error.detail || `Chat failed: ${response.statusText}`);
        }

        return response;
    },

    /**
     * Synchronous chat (non-streaming)
     */
    async syncChat(
        projectId: string,
        request: ChatRequest
    ): Promise<SyncChatResponse> {
        const response = await fetch(`${API_BASE}/projects/${projectId}/chat/sync`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || error.detail || `Chat failed: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Approve or reject a plan
     */
    async approvePlan(
        projectId: string,
        data: ApprovePlanRequest
    ): Promise<ApprovePlanResponse> {
        const response = await fetch(`${API_BASE}/projects/${projectId}/chat/approve-plan`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || error.detail || `Approve plan failed: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * List conversations for a project
     */
    async listConversations(
        projectId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<ConversationList> {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });

        const response = await fetch(
            `${API_BASE}/projects/${projectId}/conversations?${params}`,
            { headers: getHeaders() }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to list conversations: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get conversation with messages
     */
    async getConversation(
        projectId: string,
        conversationId: string
    ): Promise<ConversationMessagesResponse> {
        const response = await fetch(
            `${API_BASE}/projects/${projectId}/conversations/${conversationId}`,
            { headers: getHeaders() }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to get conversation: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Delete a conversation
     */
    async deleteConversation(
        projectId: string,
        conversationId: string
    ): Promise<{ success: boolean; message: string }> {
        const response = await fetch(
            `${API_BASE}/projects/${projectId}/conversations/${conversationId}`,
            {
                method: 'DELETE',
                headers: getHeaders(),
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to delete conversation: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get all available agents
     */
    async getAgents(): Promise<AgentsResponse> {
        const response = await fetch(`${API_BASE}/projects/agents`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to get agents: ${response.statusText}`);
        }

        return response.json();
    },
};

// ============================================================================
// SSE Stream Parser
// ============================================================================

/**
 * Parse SSE stream and yield typed events
 * Follows the same pattern as parseSSEStream in uiDesignerApi.ts
 */
export async function* parseChatSSEStream(
    response: Response
): AsyncGenerator<ChatSSEEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';

            for (const eventStr of events) {
                if (!eventStr.trim()) continue;

                const lines = eventStr.split('\n');
                let eventType: ChatSSEEventType | '' = '';
                let data = '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice(7).trim() as ChatSSEEventType;
                    } else if (line.startsWith('data: ')) {
                        data = line.slice(6);
                    }
                }

                if (eventType && data) {
                    try {
                        const parsedData = JSON.parse(data);
                        yield {
                            type: eventType,
                            data: parsedData,
                            timestamp: new Date().toISOString(),
                        };
                    } catch (e) {
                        console.error('Failed to parse SSE data:', e);
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

// ============================================================================
// Stream Handler Types
// ============================================================================

/** Callback handlers for chat streaming */
export interface ChatStreamHandlers {
    // Connection
    onConnected?: (data: SSEEventConnectedData) => void;
    // Analysis
    onIntentAnalyzed?: (data: SSEEventIntentAnalyzedData) => void;
    onContextRetrieved?: (data: { files_count: number; context_summary: string }) => void;
    // Planning
    onPlanningStarted?: (message: string) => void;
    onPlanCreated?: (data: SSEEventPlanCreatedData) => void;
    onPlanReady?: (data: SSEEventPlanReadyData) => void;
    onPlanApproved?: (approved: boolean, feedback?: string) => void;
    // Execution
    onStepStarted?: (data: SSEEventStepStartedData) => void;
    onStepCompleted?: (data: SSEEventStepCompletedData) => void;
    onStepCodeChunk?: (data: SSEEventStepCodeChunkData) => void;
    onExecutionStarted?: (totalSteps: number) => void;
    onExecutionCompleted?: (results: ExecutionResult[], success: boolean) => void;
    // Validation
    onValidationStarted?: (message: string) => void;
    onValidationThinking?: (thought: string) => void;
    onValidationIssue?: (data: SSEEventValidationIssueFoundData) => void;
    onValidationResult?: (data: SSEEventValidationResultData) => void;
    // Streaming
    onAnswerChunk?: (chunk: string, index: number, accumulated: number) => void;
    // Agent events (interactive mode)
    onAgentThinking?: (data: SSEEventAgentThinkingData) => void;
    onAgentMessage?: (data: SSEEventAgentMessageData) => void;
    onAgentHandoff?: (data: SSEEventAgentHandoffData) => void;
    onAgentStateChange?: (data: { agent: AgentInfo; state: string; metadata?: Record<string, unknown> }) => void;
    // Completion
    onComplete?: (data: SSEEventCompleteData) => void;
    onError?: (error: string, code?: string, recoverable?: boolean) => void;
}

// ============================================================================
// Stream Helper
// ============================================================================

/**
 * Stream chat with callback handlers
 * Follows the same pattern as streamDesignGeneration in uiDesignerApi.ts
 */
export async function streamChatWithHandlers(
    projectId: string,
    request: ChatRequest,
    handlers: ChatStreamHandlers,
    signal?: AbortSignal
): Promise<void> {
    const response = await chatApi.streamChat(projectId, request, signal);

    for await (const event of parseChatSSEStream(response)) {
        // Check for abort
        if (signal?.aborted) break;

        switch (event.type) {
            // Connection
            case 'connected':
                handlers.onConnected?.(event.data as unknown as SSEEventConnectedData);
                break;

            // Analysis
            case 'intent_analyzed':
                handlers.onIntentAnalyzed?.(event.data as unknown as SSEEventIntentAnalyzedData);
                break;

            case 'context_retrieved':
                handlers.onContextRetrieved?.(event.data as { files_count: number; context_summary: string });
                break;

            // Planning
            case 'planning_started':
                handlers.onPlanningStarted?.((event.data as { message: string }).message);
                break;

            case 'plan_created':
                handlers.onPlanCreated?.(event.data as unknown as SSEEventPlanCreatedData);
                break;

            case 'plan_ready':
                handlers.onPlanReady?.(event.data as unknown as SSEEventPlanReadyData);
                break;

            case 'plan_approved':
                const approvalData = event.data as { approved: boolean; feedback?: string };
                handlers.onPlanApproved?.(approvalData.approved, approvalData.feedback);
                break;

            // Execution
            case 'step_started':
                handlers.onStepStarted?.(event.data as unknown as SSEEventStepStartedData);
                break;

            case 'step_completed':
                handlers.onStepCompleted?.(event.data as unknown as SSEEventStepCompletedData);
                break;

            case 'step_code_chunk':
                handlers.onStepCodeChunk?.(event.data as unknown as SSEEventStepCodeChunkData);
                break;

            case 'execution_started':
                handlers.onExecutionStarted?.((event.data as { total_steps: number }).total_steps);
                break;

            case 'execution_completed':
                const execData = event.data as { results: ExecutionResult[]; success: boolean };
                handlers.onExecutionCompleted?.(execData.results, execData.success);
                break;

            // Validation
            case 'validation_started':
                handlers.onValidationStarted?.((event.data as { message: string }).message);
                break;

            case 'validation_thinking':
                handlers.onValidationThinking?.((event.data as { thought: string }).thought);
                break;

            case 'validation_issue_found':
                handlers.onValidationIssue?.(event.data as unknown as SSEEventValidationIssueFoundData);
                break;

            case 'validation_result':
                handlers.onValidationResult?.(event.data as unknown as SSEEventValidationResultData);
                break;

            // Streaming
            case 'answer_chunk':
                const chunkData = event.data as unknown as SSEEventAnswerChunkData;
                handlers.onAnswerChunk?.(chunkData.chunk, chunkData.chunk_index, chunkData.accumulated_length);
                break;

            // Agent events (interactive mode)
            case 'agent_thinking':
                handlers.onAgentThinking?.(event.data as unknown as SSEEventAgentThinkingData);
                break;

            case 'agent_message':
                handlers.onAgentMessage?.(event.data as unknown as SSEEventAgentMessageData);
                break;

            case 'agent_handoff':
                handlers.onAgentHandoff?.(event.data as unknown as SSEEventAgentHandoffData);
                break;

            case 'agent_state_change':
                handlers.onAgentStateChange?.(event.data as { agent: AgentInfo; state: string; metadata?: Record<string, unknown> });
                break;

            // Completion
            case 'complete':
                handlers.onComplete?.(event.data as unknown as SSEEventCompleteData);
                break;

            case 'error':
                const errorData = event.data as unknown as SSEEventErrorData;
                handlers.onError?.(errorData.error, errorData.code, errorData.recoverable);
                break;
        }
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a chat request with defaults
 */
export function createChatRequest(
    message: string,
    options?: Partial<Omit<ChatRequest, 'message'>>
): ChatRequest {
    return {
        message,
        conversation_id: options?.conversation_id,
        interactive_mode: options?.interactive_mode ?? false,
        require_plan_approval: options?.require_plan_approval ?? false,
    };
}

/**
 * Extract answer from complete event or chunks
 */
export function extractAnswerFromChunks(chunks: string[]): string {
    return chunks.join('');
}

/**
 * Check if chat response has code changes
 */
export function hasCodeChanges(response: SyncChatResponse): boolean {
    return !!(response.execution_results && response.execution_results.length > 0);
}

/**
 * Check if validation passed
 */
export function isValidationPassed(response: SyncChatResponse): boolean {
    if (!response.validation) return true;
    return response.validation.approved && response.validation.errors.length === 0;
}

/**
 * Get total files affected from execution results
 */
export function getTotalFilesAffected(results: ExecutionResult[]): number {
    return results.filter(r => r.success).length;
}

/**
 * Group execution results by action type
 */
export function groupResultsByAction(results: ExecutionResult[]): Record<string, ExecutionResult[]> {
    return results.reduce((acc, result) => {
        const action = result.action;
        if (!acc[action]) acc[action] = [];
        acc[action].push(result);
        return acc;
    }, {} as Record<string, ExecutionResult[]>);
}