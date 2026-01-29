"use client";

import { useCallback, useEffect, useRef } from 'react';
import {
    useChatStore,
    selectIsProcessing,
    selectHasCodeChanges,
    selectCanSendMessage,
    selectIsAwaitingApproval,
} from '@/store/chatStore';
import { useApiClient } from '@/hooks/useApiClient';
import { useToast } from '@/components/ui/Toast';
import { chatApi, parseChatSSEStream } from '@/lib/chatApi';
import { authService } from '@/lib/auth';
import {
    ChatRequest,
    ChatSSEEvent,
    Plan,
    AgentInfo,
    Intent,
    ExecutionResult,
    ValidationResult,
    PlanStep,
    CodeChanges,
    ProcessingData,
} from '@/types/chat';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export function useChat(projectId: string) {
    const store = useChatStore();
    const api = useApiClient();
    const { addToast } = useToast();

    // Selectors
    const isProcessing = useChatStore(selectIsProcessing);
    const hasCodeChanges = useChatStore(selectHasCodeChanges);
    const canSendMessage = useChatStore(selectCanSendMessage);
    const isAwaitingApproval = useChatStore(selectIsAwaitingApproval);

    // Refs
    const abortControllerRef = useRef<AbortController | null>(null);

    // ========================================================================
    // Initialize
    // ========================================================================

    useEffect(() => {
        store.setProjectId(projectId);
        fetchAgents();
        fetchConversations();

        return () => {
            cancelRequest();
        };
    }, [projectId]);

    // ========================================================================
    // Fetch Functions
    // ========================================================================

    const fetchAgents = useCallback(async () => {
        try {
            const data = await chatApi.getAgents();
            if (data.success && data.agents) {
                store.setAgents(data.agents);
                // Set first agent as active by default
                if (data.agents.length > 0 && !store.activeAgent) {
                    store.setActiveAgent(data.agents[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch agents:', err);
        }
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            const data = await chatApi.listConversations(projectId);
            store.setConversations(data.conversations || []);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
    }, [projectId]);

    // ========================================================================
    // Load Conversation
    // ========================================================================

    const loadConversation = useCallback(async (conversationId: string) => {
        try {
            store.setStatus('connecting');
            const data = await chatApi.getConversation(projectId, conversationId);
            store.setConversationId(conversationId);
            store.setCurrentMessages(data.messages);
            store.setStatus('idle');
        } catch (err: any) {
            console.error('Failed to load conversation:', err);
            addToast('Failed to load conversation', 'error');
            store.setError(err.message || 'Failed to load conversation');
        }
    }, [projectId, addToast]);

    // ========================================================================
    // SSE Event Handler
    // ========================================================================

    const handleSSEEvent = useCallback((event: ChatSSEEvent) => {
        const {
            setConversationId,
            setStatus,
            setActiveAgent,
            setCurrentThought,
            setCurrentIntent,
            setCurrentPlan,
            setPlanAwaitingApproval,
            addExecutionResult,
            setExecutionResults,
            setCurrentStepIndex,
            appendCodeChunk,
            setValidationResult,
            appendStreamingAnswer,
            addAssistantMessage,
            updateLastAssistantMessage,
            setError,
        } = store;

        switch (event.type) {
            // Connection
            case 'connected':
                if (event.data.conversation_id) {
                    setConversationId(event.data.conversation_id as string);
                }
                setStatus('analyzing');
                break;

            // Analysis
            case 'intent_analyzed':
                setCurrentIntent(event.data.intent as Intent);
                setStatus('analyzing');
                break;

            case 'context_retrieved':
                // Context retrieved, continue analyzing
                break;

            // Planning
            case 'planning_started':
                setStatus('planning');
                setCurrentThought((event.data.message as string) || 'Creating execution plan...');
                break;

            case 'plan_created':
                setCurrentPlan(event.data.plan as Plan);
                break;

            case 'plan_ready':
                setCurrentPlan(event.data.plan as Plan);
                if (event.data.requires_approval) {
                    setPlanAwaitingApproval(true);
                    setStatus('awaiting_approval');
                }
                break;

            case 'plan_approved':
                setPlanAwaitingApproval(false);
                setStatus('executing');
                break;

            // Execution
            case 'execution_started':
                setStatus('executing');
                setCurrentStepIndex(0);
                break;

            case 'step_started':
                setCurrentStepIndex(event.data.step_index as number);
                setCurrentThought(`Executing step ${(event.data.step_index as number) + 1}: ${(event.data.step as PlanStep).description}`);
                break;

            case 'step_code_chunk':
                const stepData = event.data as { step_index: number; chunk: string; file?: string };
                const currentPlan = store.currentPlan;
                const file = stepData.file || currentPlan?.steps[stepData.step_index]?.file || `step_${stepData.step_index}`;
                appendCodeChunk(file, stepData.chunk);
                break;

            case 'step_completed':
                addExecutionResult(event.data.result as ExecutionResult);
                break;

            case 'execution_completed':
                setExecutionResults(event.data.results as ExecutionResult[]);
                setStatus('validating');
                break;

            // Validation
            case 'validation_started':
                setStatus('validating');
                setCurrentThought((event.data.message as string) || 'Validating changes...');
                break;

            case 'validation_thinking':
                setCurrentThought(event.data.thought as string);
                break;

            case 'validation_issue_found':
                // Individual issue found during validation
                break;

            case 'validation_result':
                setValidationResult(event.data.validation as ValidationResult);
                break;

            // Streaming
            case 'answer_chunk':
                setStatus('streaming');
                appendStreamingAnswer(event.data.chunk as string);
                break;

            // Agent events (interactive mode)
            case 'agent_thinking':
                const agentThinkingData = event.data as { agent: AgentInfo; thought: string };
                setActiveAgent(agentThinkingData.agent);
                setCurrentThought(agentThinkingData.thought);
                break;

            case 'agent_message':
                const agentMsgData = event.data as { agent: AgentInfo; message: string };
                setActiveAgent(agentMsgData.agent);
                break;

            case 'agent_handoff':
                const handoffData = event.data as { to_agent: AgentInfo };
                setActiveAgent(handoffData.to_agent);
                break;

            case 'agent_state_change':
                const stateData = event.data as { agent: AgentInfo; state: string };
                setActiveAgent(stateData.agent);
                break;

            // Completion
            case 'complete':
                const completeData = event.data as {
                    success: boolean;
                    answer: string;
                    plan?: Plan;
                    execution_results?: ExecutionResult[];
                    validation?: ValidationResult;
                    error?: string;
                };

                setStatus('complete');
                setCurrentThought('');

                // Build processing data
                const processingData: ProcessingData = {
                    intent: store.currentIntent || undefined,
                    plan: completeData.plan || store.currentPlan || undefined,
                    execution_results: completeData.execution_results || store.executionResults,
                    validation: completeData.validation || store.validationResult || undefined,
                    success: completeData.success,
                    error: completeData.error || null,
                };

                // Build code changes if we have execution results
                const codeChanges: CodeChanges | undefined =
                    processingData.execution_results && processingData.execution_results.length > 0
                        ? {
                            results: processingData.execution_results,
                            validation: processingData.validation || {
                                score: 100,
                                approved: true,
                                issues: [],
                                errors: [],
                                warnings: [],
                            },
                        }
                        : undefined;

                // Finalize the streaming answer into a message
                const finalAnswer = completeData.answer || store.streamingAnswer;
                if (finalAnswer) {
                    addAssistantMessage(finalAnswer, codeChanges, processingData);
                }

                // Clear streaming state
                store.clearStreamingAnswer();

                // Refresh conversations list
                fetchConversations();
                break;

            // Error
            case 'error':
                const errorData = event.data as { error: string; recoverable?: boolean };
                setError(errorData.error);
                setCurrentThought('');
                addToast(errorData.error, 'error');
                break;
        }
    }, [store, fetchConversations, addToast]);

    // ========================================================================
    // Send Message
    // ========================================================================

    const sendMessage = useCallback(async (
        message: string,
        options?: {
            interactiveMode?: boolean;
            requirePlanApproval?: boolean;
        }
    ) => {
        if (!canSendMessage) {
            addToast('Please wait for the current request to complete', 'warning');
            return;
        }

        // Reset state for new message
        store.resetForNewMessage();
        store.setStatus('connecting');
        store.addUserMessage(message);

        // Create AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;
        store.setAbortController(controller);

        // Build request
        const request: ChatRequest = {
            message,
            conversation_id: store.conversationId || undefined,
            interactive_mode: options?.interactiveMode ?? store.interactiveMode,
            require_plan_approval: options?.requirePlanApproval ?? false,
        };

        try {
            const token = authService.getAccessToken();

            // Start SSE stream
            const response = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
            }

            // Process SSE stream
            for await (const event of parseChatSSEStream(response)) {
                if (controller.signal.aborted) break;
                handleSSEEvent(event);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                store.setStatus('idle');
                addToast('Request cancelled', 'info');
            } else {
                store.setError(err.message || 'Failed to send message');
                addToast(err.message || 'Failed to send message', 'error');
            }
        } finally {
            abortControllerRef.current = null;
            store.setAbortController(null);
        }
    }, [projectId, canSendMessage, handleSSEEvent, addToast]);

    // ========================================================================
    // Approve Plan
    // ========================================================================

    const approvePlan = useCallback(async (
        approved: boolean,
        feedback?: string
    ) => {
        if (!store.conversationId || !store.currentPlan) {
            addToast('No plan to approve', 'error');
            return;
        }

        try {
            store.setPlanAwaitingApproval(false);

            if (approved) {
                store.setStatus('executing');
            } else {
                store.setStatus('idle');
                store.setCurrentPlan(null);
                addToast('Plan rejected', 'info');
                return;
            }

            // Get the last assistant message ID (which should have the plan)
            const lastMessage = store.currentMessages[store.currentMessages.length - 1];
            const messageId = lastMessage?.role === 'assistant' ? lastMessage.id : 'unknown';

            const result = await chatApi.approvePlan(projectId, {
                conversation_id: store.conversationId,
                message_id: messageId,
                approved,
                feedback,
            });

            if (result.success) {
                if (result.execution_results) {
                    store.setExecutionResults(result.execution_results);
                }
                if (result.validation) {
                    store.setValidationResult(result.validation);
                }
                store.setStatus('complete');
                addToast('Plan executed successfully', 'success');
            } else {
                store.setError(result.error || 'Plan execution failed');
                addToast(result.error || 'Plan execution failed', 'error');
            }
        } catch (err: any) {
            store.setError(err.message || 'Failed to approve plan');
            addToast(err.message || 'Failed to approve plan', 'error');
        }
    }, [projectId, addToast]);

    // ========================================================================
    // Cancel Request
    // ========================================================================

    const cancelRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        store.setStatus('idle');
        store.setAbortController(null);
        store.setCurrentThought('');
    }, []);

    // ========================================================================
    // Delete Conversation
    // ========================================================================

    const deleteConversation = useCallback(async (conversationId: string) => {
        try {
            await chatApi.deleteConversation(projectId, conversationId);
            store.removeConversation(conversationId);

            if (store.conversationId === conversationId) {
                store.startNewConversation();
            }

            addToast('Conversation deleted', 'success');
        } catch (err: any) {
            addToast(err.message || 'Failed to delete conversation', 'error');
        }
    }, [projectId, addToast]);

    // ========================================================================
    // Start New Conversation
    // ========================================================================

    const startNewConversation = useCallback(() => {
        cancelRequest();
        store.startNewConversation();
    }, [cancelRequest]);

    // ========================================================================
    // Retry Last Message
    // ========================================================================

    const retryLastMessage = useCallback(() => {
        const messages = store.currentMessages;
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

        if (lastUserMessage) {
            // Remove last assistant message if exists
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.role === 'assistant') {
                store.setCurrentMessages(messages.slice(0, -1));
            }

            sendMessage(lastUserMessage.content);
        }
    }, [sendMessage]);

    // ========================================================================
    // Return
    // ========================================================================

    return {
        // State
        projectId: store.projectId,
        conversationId: store.conversationId,
        status: store.status,
        agents: store.agents,
        activeAgent: store.activeAgent,
        conversations: store.conversations,
        messages: store.currentMessages,
        streamingAnswer: store.streamingAnswer,
        currentThought: store.currentThought,
        currentIntent: store.currentIntent,
        currentPlan: store.currentPlan,
        planAwaitingApproval: store.planAwaitingApproval,
        executionResults: store.executionResults,
        currentStepIndex: store.currentStepIndex,
        validationResult: store.validationResult,
        codeChunks: store.codeChunks,
        selectedFile: store.selectedFile,
        error: store.error,

        // Computed
        isProcessing,
        hasCodeChanges,
        canSendMessage,
        isAwaitingApproval,

        // UI State
        sidebarOpen: store.sidebarOpen,
        showCodePanel: store.showCodePanel,
        interactiveMode: store.interactiveMode,

        // Actions
        fetchAgents,
        fetchConversations,
        loadConversation,
        sendMessage,
        approvePlan,
        cancelRequest,
        deleteConversation,
        startNewConversation,
        retryLastMessage,

        // Store Actions
        setSelectedFile: store.setSelectedFile,
        toggleSidebar: store.toggleSidebar,
        setSidebarOpen: store.setSidebarOpen,
        toggleCodePanel: store.toggleCodePanel,
        setShowCodePanel: store.setShowCodePanel,
        setInteractiveMode: store.setInteractiveMode,
        setActiveAgent: store.setActiveAgent,
        reset: store.reset,
    };
}