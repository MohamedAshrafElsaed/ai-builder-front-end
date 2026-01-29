import { authService } from './auth';
import {
    Agent,
    TechStack,
    DesignRequest,
    GeneratedFile,
    ApplyResult,
    DesignResult,
} from '@/types/ui-designer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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

export const uiDesignerApi = {
    /**
     * Get agent information
     */
    async getAgent(): Promise<Agent> {
        const response = await fetch(`${API_BASE}/ui-designer/agent`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get agent: ${response.statusText}`);
        }

        const data = await response.json();
        return data.agent;
    },

    /**
     * Get tech stack for a project
     */
    async getTechStack(projectId: string): Promise<TechStack> {
        const response = await fetch(`${API_BASE}/ui-designer/${projectId}/tech-stack`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get tech stack: ${response.statusText}`);
        }

        const data = await response.json();
        return data.tech_stack;
    },

    /**
     * Start streaming design generation
     * Returns a ReadableStream for SSE handling
     */
    async generateDesignStream(
        projectId: string,
        request: DesignRequest,
        signal?: AbortSignal
    ): Promise<Response> {
        const response = await fetch(`${API_BASE}/ui-designer/${projectId}/design`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(request),
            signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Generation failed: ${response.statusText}`);
        }

        return response;
    },

    /**
     * Generate design synchronously (non-streaming)
     */
    async generateDesignSync(
        projectId: string,
        request: DesignRequest
    ): Promise<{
        success: boolean;
        design_id: string;
        files: GeneratedFile[];
        summary: string;
        components_created: string[];
        dependencies_added: string[];
        duration_ms: number;
        total_files: number;
        total_lines: number;
        tech_stack: TechStack;
    }> {
        const response = await fetch(`${API_BASE}/ui-designer/${projectId}/design/sync`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Generation failed: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get design status
     */
    async getDesignStatus(
        projectId: string,
        designId: string
    ): Promise<{
        design_id: string;
        status: 'generating' | 'completed' | 'error' | 'cancelled';
        total_files?: number;
        total_lines?: number;
        components_created?: string[];
        duration_ms?: number;
        error?: string;
    }> {
        const response = await fetch(
            `${API_BASE}/ui-designer/${projectId}/design/${designId}`,
            { headers: getHeaders() }
        );

        if (!response.ok) {
            throw new Error(`Failed to get design status: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get generated files for a design
     */
    async getDesignFiles(
        projectId: string,
        designId: string
    ): Promise<{
        design_id: string;
        files: GeneratedFile[];
        total_files: number;
    }> {
        const response = await fetch(
            `${API_BASE}/ui-designer/${projectId}/design/${designId}/files`,
            { headers: getHeaders() }
        );

        if (!response.ok) {
            throw new Error(`Failed to get design files: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Apply design files to project
     */
    async applyDesign(
        projectId: string,
        designId: string,
        options?: {
            selected_files?: string[];
            backup?: boolean;
            overwrite_existing?: boolean;
        }
    ): Promise<ApplyResult> {
        const response = await fetch(
            `${API_BASE}/ui-designer/${projectId}/design/${designId}/apply`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    design_id: designId,
                    selected_files: options?.selected_files ?? null,
                    backup: options?.backup ?? true,
                    overwrite_existing: options?.overwrite_existing ?? false,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to apply design: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Cancel ongoing design generation
     */
    async cancelDesign(
        projectId: string,
        designId: string
    ): Promise<{ success: boolean; message: string }> {
        const response = await fetch(
            `${API_BASE}/ui-designer/${projectId}/design/${designId}`,
            {
                method: 'DELETE',
                headers: getHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to cancel design: ${response.statusText}`);
        }

        return response.json();
    },
};

/**
 * Parse SSE stream and yield events
 */
export async function* parseSSEStream(
    response: Response
): AsyncGenerator<{ type: string; data: any }> {
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
                    try {
                        yield { type: eventType, data: JSON.parse(data) };
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

/**
 * Helper to stream design generation with callback handlers
 */
export async function streamDesignGeneration(
    projectId: string,
    request: DesignRequest,
    handlers: {
        onConnected?: (data: any) => void;
        onThinking?: (thought: string, progress?: number) => void;
        onTechDetected?: (techStack: TechStack) => void;
        onCodeChunk?: (chunk: string, index: number) => void;
        onFileReady?: (file: GeneratedFile, index: number) => void;
        onComplete?: (result: DesignResult, files: GeneratedFile[]) => void;
        onError?: (error: string) => void;
    },
    signal?: AbortSignal
): Promise<void> {
    const response = await uiDesignerApi.generateDesignStream(projectId, request, signal);

    for await (const event of parseSSEStream(response)) {
        switch (event.type) {
            case 'connected':
                handlers.onConnected?.(event.data);
                break;
            case 'agent_thinking':
                handlers.onThinking?.(event.data.thought, event.data.progress);
                break;
            case 'tech_detected':
                handlers.onTechDetected?.(event.data.tech_stack);
                break;
            case 'code_chunk':
                handlers.onCodeChunk?.(event.data.chunk, event.data.chunk_index);
                break;
            case 'file_ready':
                handlers.onFileReady?.(event.data.file, event.data.file_index);
                break;
            case 'design_complete':
                handlers.onComplete?.(event.data.result, event.data.files);
                break;
            case 'error':
                handlers.onError?.(event.data.message || event.data.error);
                break;
        }
    }
}