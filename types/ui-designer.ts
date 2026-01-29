// types/ui-designer.ts - Complete type definitions for UI Designer

export interface Agent {
    type: string;
    name: string;
    role: string;
    color: string;
    icon: string;
    avatar_emoji: string;
    personality: string;
}

export interface TechStack {
    framework: 'react' | 'vue' | 'blade' | 'livewire' | 'unknown';
    css_framework: 'tailwind' | 'bootstrap' | 'custom' | 'none';
    ui_libraries: string[];
    typescript: boolean;
    component_path: string;
    style_path: string;
    pages_path: string;
    dark_mode_supported: boolean;
    confidence: number;
    design_tokens: DesignTokens;
    existing_components: ExistingComponent[];
}

export interface DesignTokens {
    colors: Record<string, string>;
    spacing: Record<string, string>;
    typography: Record<string, string>;
    borders: Record<string, string>;
}

export interface ExistingComponent {
    name: string;
    path: string;
    props: string[];
}

export interface GeneratedFile {
    path: string;
    content: string;
    type: 'component' | 'style' | 'test' | 'story' | 'util';
    language: 'tsx' | 'vue' | 'php' | 'css' | 'js' | 'ts';
    line_count: number;
    component_name: string;
    exports?: string[];
    dependencies?: string[];
}

export interface DesignResult {
    success: boolean;
    total_files: number;
    total_lines: number;
    components_created: string[];
    dependencies_added: string[];
    duration_ms: number;
}

export interface ApplyResult {
    success: boolean;
    files_applied: string[];
    files_skipped: string[];
    backup_path: string | null;
    errors: string[];
}

export type MessageType =
    | 'user'
    | 'agent_greeting'
    | 'agent_thinking'
    | 'agent_message'
    | 'tech_detected'
    | 'generation_progress'
    | 'file_generated'
    | 'design_complete'
    | 'error';

export interface Message {
    id: string;
    type: MessageType;
    content: string;
    timestamp: Date;
    metadata?: {
        thought?: string;
        techStack?: TechStack;
        file?: GeneratedFile;
        result?: DesignResult;
        progress?: number;
        error?: string;
    };
}

export type DesignStatus =
    | 'idle'
    | 'connecting'
    | 'detecting'
    | 'optimizing'
    | 'generating'
    | 'complete'
    | 'error'
    | 'cancelled';

export type ActiveTab = 'preview' | 'code' | 'files';

// SSE Event Types
export interface SSEEventConnected {
    design_id: string;
    agent: Agent;
    message: string;
}

export interface SSEEventDesignStarted {
    design_id: string;
    agent: Agent;
    message: string;
}

export interface SSEEventAgentThinking {
    design_id: string;
    thought: string;
    progress?: number;
}

export interface SSEEventTechDetected {
    design_id: string;
    tech_stack: TechStack;
}

export interface SSEEventPromptOptimized {
    design_id: string;
    enhancements: string[];
    requirements: Record<string, unknown>;
}

export interface SSEEventGenerationStarted {
    design_id: string;
    message: string;
}

export interface SSEEventCodeChunk {
    design_id: string;
    chunk: string;
    chunk_index: number;
    accumulated_length: number;
}

export interface SSEEventFileReady {
    design_id: string;
    file: GeneratedFile;
    file_index: number;
    message?: string;
}

export interface SSEEventDesignComplete {
    design_id: string;
    result: DesignResult;
    files: GeneratedFile[];
    message: string;
}

export interface SSEEventComplete {
    design_id: string;
    success: boolean;
    message: string;
}

export interface SSEEventError {
    design_id: string;
    error: string;
    message: string;
}

export type SSEEvent =
    | { type: 'connected'; data: SSEEventConnected }
    | { type: 'design_started'; data: SSEEventDesignStarted }
    | { type: 'agent_thinking'; data: SSEEventAgentThinking }
    | { type: 'tech_detected'; data: SSEEventTechDetected }
    | { type: 'prompt_optimized'; data: SSEEventPromptOptimized }
    | { type: 'generation_started'; data: SSEEventGenerationStarted }
    | { type: 'code_chunk'; data: SSEEventCodeChunk }
    | { type: 'file_ready'; data: SSEEventFileReady }
    | { type: 'design_complete'; data: SSEEventDesignComplete }
    | { type: 'complete'; data: SSEEventComplete }
    | { type: 'error'; data: SSEEventError };

export interface DesignRequest {
    prompt: string;
    conversation_id?: string;
    target_path?: string;
    design_preferences?: {
        colors?: string;
        animations?: boolean;
        [key: string]: unknown;
    };
    include_tests?: boolean;
    include_stories?: boolean;
}

// File icon mapping
export const FILE_ICONS: Record<string, string> = {
    tsx: '⚛️',
    jsx: '⚛️',
    vue: '💚',
    php: '🐘',
    css: '🎨',
    scss: '🎨',
    ts: '📘',
    js: '📒',
    json: '📋',
    default: '📄',
};

export function getFileIcon(language: string): string {
    return FILE_ICONS[language] || FILE_ICONS.default;
}

export function getFileExtension(path: string): string {
    return path.split('.').pop() || '';
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}