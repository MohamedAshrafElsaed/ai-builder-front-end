import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    ChatStatus,
    ChatMessage,
    Conversation,
    AgentInfo,
    Intent,
    Plan,
    PlanStep,
    ExecutionResult,
    ValidationResult,
    CodeChanges,
    ProcessingData,
    generateId,
} from '@/types/chat';

// ============================================================================
// State Interface
// ============================================================================

interface ChatState {
    // Connection
    projectId: string | null;
    conversationId: string | null;
    status: ChatStatus;
    abortController: AbortController | null;

    // Agents
    agents: AgentInfo[];
    activeAgent: AgentInfo | null;

    // Conversations
    conversations: Conversation[];
    currentMessages: ChatMessage[];

    // Streaming State
    streamingAnswer: string;
    currentThought: string;
    currentIntent: Intent | null;

    // Plan State
    currentPlan: Plan | null;
    planAwaitingApproval: boolean;

    // Execution State
    executionResults: ExecutionResult[];
    currentStepIndex: number;

    // Validation
    validationResult: ValidationResult | null;

    // Code Display
    codeChunks: Map<string, string>;
    selectedFile: string | null;

    // UI State
    sidebarOpen: boolean;
    showCodePanel: boolean;
    interactiveMode: boolean;

    // Error
    error: string | null;

    // Actions
    setProjectId: (id: string) => void;
    setConversationId: (id: string | null) => void;
    setStatus: (status: ChatStatus) => void;
    setAgents: (agents: AgentInfo[]) => void;
    setActiveAgent: (agent: AgentInfo | null) => void;

    // Conversation Actions
    setConversations: (conversations: Conversation[]) => void;
    addConversation: (conversation: Conversation) => void;
    removeConversation: (id: string) => void;
    updateConversation: (id: string, updates: Partial<Conversation>) => void;

    // Message Actions
    setCurrentMessages: (messages: ChatMessage[]) => void;
    addUserMessage: (content: string) => void;
    addAssistantMessage: (content: string, codeChanges?: CodeChanges, processingData?: ProcessingData) => void;
    updateLastAssistantMessage: (content: string, processingData?: ProcessingData) => void;

    // Streaming Actions
    appendStreamingAnswer: (chunk: string) => void;
    clearStreamingAnswer: () => void;
    setCurrentThought: (thought: string) => void;
    setCurrentIntent: (intent: Intent | null) => void;

    // Plan Actions
    setCurrentPlan: (plan: Plan | null) => void;
    setPlanAwaitingApproval: (awaiting: boolean) => void;

    // Execution Actions
    addExecutionResult: (result: ExecutionResult) => void;
    setExecutionResults: (results: ExecutionResult[]) => void;
    setCurrentStepIndex: (index: number) => void;
    appendCodeChunk: (file: string, chunk: string) => void;
    clearCodeChunks: () => void;

    // Validation Actions
    setValidationResult: (result: ValidationResult | null) => void;

    // UI Actions
    setSelectedFile: (file: string | null) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleCodePanel: () => void;
    setShowCodePanel: (show: boolean) => void;
    setInteractiveMode: (enabled: boolean) => void;

    // Abort & Error
    setAbortController: (controller: AbortController | null) => void;
    setError: (error: string | null) => void;

    // Reset
    reset: () => void;
    resetForNewMessage: () => void;
    startNewConversation: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
    // Connection
    projectId: null as string | null,
    conversationId: null as string | null,
    status: 'idle' as ChatStatus,
    abortController: null as AbortController | null,

    // Agents
    agents: [] as AgentInfo[],
    activeAgent: null as AgentInfo | null,

    // Conversations
    conversations: [] as Conversation[],
    currentMessages: [] as ChatMessage[],

    // Streaming State
    streamingAnswer: '',
    currentThought: '',
    currentIntent: null as Intent | null,

    // Plan State
    currentPlan: null as Plan | null,
    planAwaitingApproval: false,

    // Execution State
    executionResults: [] as ExecutionResult[],
    currentStepIndex: 0,

    // Validation
    validationResult: null as ValidationResult | null,

    // Code Display
    codeChunks: new Map<string, string>(),
    selectedFile: null as string | null,

    // UI State
    sidebarOpen: true,
    showCodePanel: false,
    interactiveMode: false,

    // Error
    error: null as string | null,
};

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // ----------------------------------------------------------------
            // Connection Actions
            // ----------------------------------------------------------------

            setProjectId: (id) => set({ projectId: id }),

            setConversationId: (id) => set({ conversationId: id }),

            setStatus: (status) => set({ status }),

            setAgents: (agents) => set({ agents }),

            setActiveAgent: (agent) => set({ activeAgent: agent }),

            // ----------------------------------------------------------------
            // Conversation Actions
            // ----------------------------------------------------------------

            setConversations: (conversations) => set({ conversations }),

            addConversation: (conversation) => set((state) => ({
                conversations: [conversation, ...state.conversations],
            })),

            removeConversation: (id) => set((state) => ({
                conversations: state.conversations.filter((c) => c.id !== id),
                // Clear current if deleted
                ...(state.conversationId === id ? {
                    conversationId: null,
                    currentMessages: [],
                } : {}),
            })),

            updateConversation: (id, updates) => set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                ),
            })),

            // ----------------------------------------------------------------
            // Message Actions
            // ----------------------------------------------------------------

            setCurrentMessages: (messages) => set({ currentMessages: messages }),

            addUserMessage: (content) => set((state) => ({
                currentMessages: [
                    ...state.currentMessages,
                    {
                        id: generateId(),
                        role: 'user',
                        content,
                        created_at: new Date().toISOString(),
                    },
                ],
            })),

            addAssistantMessage: (content, codeChanges, processingData) => set((state) => ({
                currentMessages: [
                    ...state.currentMessages,
                    {
                        id: generateId(),
                        role: 'assistant',
                        content,
                        code_changes: codeChanges,
                        processing_data: processingData,
                        created_at: new Date().toISOString(),
                    },
                ],
            })),

            updateLastAssistantMessage: (content, processingData) => set((state) => {
                const messages = [...state.currentMessages];
                const lastIndex = messages.length - 1;
                if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
                    messages[lastIndex] = {
                        ...messages[lastIndex],
                        content,
                        ...(processingData ? { processing_data: processingData } : {}),
                    };
                }
                return { currentMessages: messages };
            }),

            // ----------------------------------------------------------------
            // Streaming Actions
            // ----------------------------------------------------------------

            appendStreamingAnswer: (chunk) => set((state) => ({
                streamingAnswer: state.streamingAnswer + chunk,
            })),

            clearStreamingAnswer: () => set({ streamingAnswer: '' }),

            setCurrentThought: (thought) => set({ currentThought: thought }),

            setCurrentIntent: (intent) => set({ currentIntent: intent }),

            // ----------------------------------------------------------------
            // Plan Actions
            // ----------------------------------------------------------------

            setCurrentPlan: (plan) => set({ currentPlan: plan }),

            setPlanAwaitingApproval: (awaiting) => set({
                planAwaitingApproval: awaiting,
                status: awaiting ? 'awaiting_approval' : get().status,
            }),

            // ----------------------------------------------------------------
            // Execution Actions
            // ----------------------------------------------------------------

            addExecutionResult: (result) => set((state) => ({
                executionResults: [...state.executionResults, result],
            })),

            setExecutionResults: (results) => set({ executionResults: results }),

            setCurrentStepIndex: (index) => set({ currentStepIndex: index }),

            appendCodeChunk: (file, chunk) => set((state) => {
                const newChunks = new Map(state.codeChunks);
                const existing = newChunks.get(file) || '';
                newChunks.set(file, existing + chunk);
                return {
                    codeChunks: newChunks,
                    // Auto-select first file
                    selectedFile: state.selectedFile || file,
                    // Show code panel when chunks arrive
                    showCodePanel: true,
                };
            }),

            clearCodeChunks: () => set({
                codeChunks: new Map(),
                selectedFile: null,
            }),

            // ----------------------------------------------------------------
            // Validation Actions
            // ----------------------------------------------------------------

            setValidationResult: (result) => set({ validationResult: result }),

            // ----------------------------------------------------------------
            // UI Actions
            // ----------------------------------------------------------------

            setSelectedFile: (file) => set({ selectedFile: file }),

            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            toggleCodePanel: () => set((state) => ({ showCodePanel: !state.showCodePanel })),

            setShowCodePanel: (show) => set({ showCodePanel: show }),

            setInteractiveMode: (enabled) => set({ interactiveMode: enabled }),

            // ----------------------------------------------------------------
            // Abort & Error
            // ----------------------------------------------------------------

            setAbortController: (controller) => set({ abortController: controller }),

            setError: (error) => set({
                error,
                status: error ? 'error' : get().status,
            }),

            // ----------------------------------------------------------------
            // Reset Actions
            // ----------------------------------------------------------------

            reset: () => set({
                ...initialState,
                codeChunks: new Map(),
            }),

            resetForNewMessage: () => set({
                status: 'idle',
                streamingAnswer: '',
                currentThought: '',
                currentIntent: null,
                currentPlan: null,
                planAwaitingApproval: false,
                executionResults: [],
                currentStepIndex: 0,
                validationResult: null,
                codeChunks: new Map(),
                selectedFile: null,
                error: null,
                // Keep: projectId, conversationId, agents, activeAgent,
                //       conversations, currentMessages, sidebarOpen, showCodePanel, interactiveMode
            }),

            startNewConversation: () => set({
                conversationId: null,
                currentMessages: [],
                status: 'idle',
                streamingAnswer: '',
                currentThought: '',
                currentIntent: null,
                currentPlan: null,
                planAwaitingApproval: false,
                executionResults: [],
                currentStepIndex: 0,
                validationResult: null,
                codeChunks: new Map(),
                selectedFile: null,
                showCodePanel: false,
                error: null,
                // Keep: projectId, agents, activeAgent, conversations, sidebarOpen, interactiveMode
            }),
        }),
        { name: 'chat-store' }
    )
);

// ============================================================================
// Selectors
// ============================================================================

/** Check if currently processing a message */
export const selectIsProcessing = (state: ChatState): boolean =>
    ['connecting', 'analyzing', 'planning', 'executing', 'validating', 'streaming'].includes(state.status);

/** Check if there are code changes */
export const selectHasCodeChanges = (state: ChatState): boolean =>
    state.executionResults.length > 0;

/** Get current plan step */
export const selectCurrentStep = (state: ChatState): PlanStep | null =>
    state.currentPlan?.steps[state.currentStepIndex] ?? null;

/** Get list of files with code chunks */
export const selectFileList = (state: ChatState): string[] =>
    Array.from(state.codeChunks.keys());

/** Get code for selected file */
export const selectSelectedCode = (state: ChatState): string =>
    state.selectedFile ? state.codeChunks.get(state.selectedFile) ?? '' : '';

/** Check if can send a new message */
export const selectCanSendMessage = (state: ChatState): boolean =>
    state.status === 'idle' || state.status === 'complete' || state.status === 'error';

/** Check if waiting for plan approval */
export const selectIsAwaitingApproval = (state: ChatState): boolean =>
    state.status === 'awaiting_approval' && state.planAwaitingApproval;

/** Get total steps in current plan */
export const selectTotalSteps = (state: ChatState): number =>
    state.currentPlan?.steps.length ?? 0;

/** Get execution progress as percentage */
export const selectExecutionProgress = (state: ChatState): number => {
    const total = state.currentPlan?.steps.length ?? 0;
    if (total === 0) return 0;
    return Math.round((state.currentStepIndex / total) * 100);
};

/** Get successful execution results count */
export const selectSuccessfulResults = (state: ChatState): number =>
    state.executionResults.filter((r) => r.success).length;

/** Get failed execution results count */
export const selectFailedResults = (state: ChatState): number =>
    state.executionResults.filter((r) => !r.success).length;

/** Check if validation passed */
export const selectValidationPassed = (state: ChatState): boolean =>
    state.validationResult?.approved === true &&
    state.validationResult?.errors.length === 0;

/** Get validation issues count */
export const selectValidationIssuesCount = (state: ChatState): number =>
    state.validationResult?.issues.length ?? 0;

/** Get conversation by ID */
export const selectConversationById = (id: string) => (state: ChatState): Conversation | undefined =>
    state.conversations.find((c) => c.id === id);

/** Get last message in current conversation */
export const selectLastMessage = (state: ChatState): ChatMessage | undefined =>
    state.currentMessages[state.currentMessages.length - 1];

/** Get message count */
export const selectMessageCount = (state: ChatState): number =>
    state.currentMessages.length;