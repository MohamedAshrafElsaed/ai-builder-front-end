"use client";

import { useCallback, useEffect, useRef } from 'react';
import { useUIDesignerStore, selectIsGenerating } from '@/store/uiDesignerStore';
import { useApiClient } from '@/hooks/useApiClient';
import { authService } from '@/lib/auth';
import { Agent, TechStack, DesignRequest, ApplyResult, SSEEvent } from '@/types/ui-designer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export function useUIDesigner(projectId: string) {
    const store = useUIDesignerStore();
    const api = useApiClient();
    const isGenerating = useUIDesignerStore(selectIsGenerating);
    const eventSourceRef = useRef<AbortController | null>(null);

    useEffect(() => {
        store.setProjectId(projectId);
        fetchAgent();
        fetchTechStack();

        return () => {
            cancelGeneration();
        };
    }, [projectId]);

    const fetchAgent = useCallback(async () => {
        try {
            // Agent endpoint: GET /projects/agent (no project ID)
            const data = await api.get<{ success: boolean; agent: Agent }>(`/projects/agent`);
            if (data.success && data.agent) {
                store.setAgent(data.agent);
                store.addMessage('agent_greeting', getGreeting(data.agent), { thought: data.agent.personality });
            }
        } catch (err) {
            console.error('Failed to fetch agent:', err);
        }
    }, [api]);

    const fetchTechStack = useCallback(async () => {
        try {
            // Tech stack endpoint: GET /projects/{project_id}/tech-stack
            const data = await api.get<{ success: boolean; tech_stack: TechStack }>(`/projects/${projectId}/tech-stack`);
            if (data.success && data.tech_stack) {
                store.setTechStack(data.tech_stack);
                store.addMessage('tech_detected', 'Detected your project technology stack.', {
                    techStack: data.tech_stack,
                });
            }
        } catch (err) {
            console.error('Failed to fetch tech stack:', err);
        }
    }, [projectId, api]);

    const startGeneration = useCallback(async (request: DesignRequest) => {
        store.resetForNewGeneration();
        store.setStatus('connecting');
        store.addMessage('user', request.prompt);

        const controller = new AbortController();
        eventSourceRef.current = controller;
        store.setAbortController(controller);

        try {
            const token = authService.getAccessToken();
            // Design endpoint: POST /projects/{project_id}/design
            const response = await fetch(`${API_BASE}/projects/${projectId}/design`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() || '';

                for (const eventStr of events) {
                    if (!eventStr.trim()) continue;
                    const event = parseSSEEvent(eventStr);
                    if (event) handleSSEEvent(event);
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                store.setStatus('cancelled');
                store.addMessage('agent_message', 'Generation cancelled.');
            } else {
                store.setError(err.message || 'Generation failed');
                store.addMessage('error', err.message || 'An error occurred during generation.');
            }
        } finally {
            eventSourceRef.current = null;
            store.setAbortController(null);
        }
    }, [projectId]);

    const cancelGeneration = useCallback(async () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.abort();
        }

        const designId = store.designId;
        if (designId) {
            try {
                // Cancel endpoint: DELETE /projects/{project_id}/design/{design_id}
                await api.delete(`/projects/${projectId}/design/${designId}`);
            } catch (err) {
                console.error('Failed to cancel on server:', err);
            }
        }
    }, [projectId, api]);

    const applyDesign = useCallback(async (selectedFiles?: string[]): Promise<ApplyResult> => {
        const designId = store.designId;
        if (!designId) throw new Error('No design to apply');

        store.setIsApplying(true);

        try {
            const files = selectedFiles || Array.from(store.selectedFilesForApply);
            // Apply endpoint: POST /projects/{project_id}/design/{design_id}/apply
            const result = await api.post<ApplyResult>(`/projects/${projectId}/design/${designId}/apply`, {
                design_id: designId,
                selected_files: files.length > 0 ? files : null,
                backup: true,
                overwrite_existing: false,
            });

            if (result.success) {
                store.addMessage('agent_message', `Successfully applied ${result.files_applied.length} file(s) to your project!`);
            } else {
                store.addMessage('error', `Failed to apply: ${result.errors.join(', ')}`);
            }

            return result;
        } finally {
            store.setIsApplying(false);
        }
    }, [projectId, api]);

    const handleSSEEvent = useCallback((event: SSEEvent) => {
        const { setDesignId, setAgent, setStatus, setCurrentThought, setTechStack,
            appendStreamingCode, addGeneratedFile, setGeneratedFiles, setResult, addMessage } = store;

        switch (event.type) {
            case 'connected':
                setDesignId(event.data.design_id);
                if (event.data.agent) setAgent(event.data.agent);
                addMessage('agent_message', event.data.message);
                break;

            case 'design_started':
                setStatus('detecting');
                addMessage('agent_message', event.data.message);
                break;

            case 'agent_thinking':
                setCurrentThought(event.data.thought);
                addMessage('agent_thinking', event.data.thought, {
                    thought: event.data.thought,
                    progress: event.data.progress,
                });
                break;

            case 'tech_detected':
                setStatus('optimizing');
                setTechStack(event.data.tech_stack);
                addMessage('tech_detected', 'Technology stack detected!', {
                    techStack: event.data.tech_stack,
                });
                break;

            case 'prompt_optimized':
                addMessage('agent_message', `Enhanced your request with: ${event.data.enhancements.join(', ')}`);
                break;

            case 'generation_started':
                setStatus('generating');
                setCurrentThought('');
                addMessage('agent_message', event.data.message);
                break;

            case 'code_chunk':
                appendStreamingCode(event.data.chunk);
                break;

            case 'file_ready':
                addGeneratedFile(event.data.file);
                addMessage('file_generated', `Generated: ${event.data.file.component_name || event.data.file.path}`, { file: event.data.file });
                store.clearStreamingCode();
                break;

            case 'design_complete':
                setStatus('complete');
                setResult(event.data.result);
                setGeneratedFiles(event.data.files);
                addMessage('design_complete', event.data.message, { result: event.data.result });
                break;

            case 'complete':
                if (store.status !== 'complete') {
                    setStatus('complete');
                }
                break;

            case 'error':
                store.setError(event.data.error);
                addMessage('error', event.data.message, { error: event.data.error });
                break;
        }
    }, []);

    return {
        projectId: store.projectId,
        designId: store.designId,
        status: store.status,
        agent: store.agent,
        techStack: store.techStack,
        messages: store.messages,
        currentThought: store.currentThought,
        streamingCode: store.streamingCode,
        generatedFiles: store.generatedFiles,
        selectedFileIndex: store.selectedFileIndex,
        result: store.result,
        error: store.error,
        activeTab: store.activeTab,
        selectedFilesForApply: store.selectedFilesForApply,
        isApplying: store.isApplying,
        isGenerating,

        startGeneration,
        cancelGeneration,
        applyDesign,
        selectFile: store.selectFile,
        setActiveTab: store.setActiveTab,
        toggleFileSelection: store.toggleFileSelection,
        selectAllFiles: store.selectAllFiles,
        deselectAllFiles: store.deselectAllFiles,
        reset: store.reset,
    };
}

function parseSSEEvent(eventStr: string): SSEEvent | null {
    try {
        const lines = eventStr.split('\n');
        let eventType = '';
        let data = '';

        for (const line of lines) {
            if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
                data = line.slice(6);
            }
        }

        if (eventType && data) {
            return { type: eventType, data: JSON.parse(data) } as SSEEvent;
        }
    } catch (err) {
        console.error('Failed to parse SSE event:', err);
    }
    return null;
}

function getGreeting(agent: Agent): string {
    return `Hey there! I'm ${agent.name}, your ${agent.role}. ${agent.avatar_emoji} I'm here to help you create beautiful UI components. Just describe what you'd like to build!`;
}