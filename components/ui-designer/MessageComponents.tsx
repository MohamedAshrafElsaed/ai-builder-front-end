"use client";

import { Agent, Message, TechStack, GeneratedFile, DesignResult, getFileIcon } from '@/types/ui-designer';

interface MessageBubbleProps {
    message: Message;
    agent: Agent | null;
}

export function MessageBubble({ message, agent }: MessageBubbleProps) {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';

    // User message
    if (isUser) {
        return (
            <div className="flex justify-end animate-in slide-in-from-right-2 duration-200">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-sm bg-pink-600 text-white">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        );
    }

    // Error message
    if (isError) {
        return (
            <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-sm">
                    ⚠️
                </div>
                <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{message.content}</p>
                    {message.metadata?.error && (
                        <p className="mt-1 text-xs text-red-400/60 font-mono">{message.metadata.error}</p>
                    )}
                </div>
            </div>
        );
    }

    // Tech detected message
    if (message.type === 'tech_detected' && message.metadata?.techStack) {
        return (
            <TechStackCard techStack={message.metadata.techStack} agent={agent} />
        );
    }

    // File generated message
    if (message.type === 'file_generated' && message.metadata?.file) {
        return (
            <FileGeneratedCard file={message.metadata.file} agent={agent} />
        );
    }

    // Design complete message
    if (message.type === 'design_complete' && message.metadata?.result) {
        return (
            <DesignCompleteCard result={message.metadata.result} agent={agent} />
        );
    }

    // Agent thinking message (simplified - main thinking is in ThinkingIndicator)
    if (message.type === 'agent_thinking') {
        return null; // Handled by ThinkingIndicator
    }

    // Default agent message
    return (
        <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: agent?.color ? `${agent.color}20` : '#ec489920' }}
            >
                {agent?.avatar_emoji || '🎨'}
            </div>
            <div className="flex-1 max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1a1a1a] border border-[#262626]">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
}

// ThinkingIndicator.tsx
interface ThinkingIndicatorProps {
    thought: string;
    agent: Agent | null;
}

export function ThinkingIndicator({ thought, agent }: ThinkingIndicatorProps) {
    return (
        <div className="flex gap-3 animate-in fade-in duration-300">
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm animate-pulse"
                style={{ backgroundColor: agent?.color ? `${agent.color}20` : '#ec489920' }}
            >
                {agent?.avatar_emoji || '🎨'}
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1a1a1a] border border-[#262626]">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm text-zinc-400 animate-pulse">{thought}</p>
                </div>
            </div>
        </div>
    );
}

// TechStackBadge.tsx
interface TechStackBadgeProps {
    techStack: TechStack;
}

export function TechStackBadge({ techStack }: TechStackBadgeProps) {
    const frameworkIcons: Record<string, string> = {
        react: '⚛️',
        vue: '💚',
        blade: '🔺',
        livewire: '⚡',
        unknown: '📦',
    };

    const cssIcons: Record<string, string> = {
        tailwind: '🎨',
        bootstrap: '🅱️',
        custom: '✨',
        none: '📝',
    };

    return (
        <div className="flex items-center gap-2 py-2 animate-in slide-in-from-left-2 duration-200">
            <span className="text-xs text-zinc-500">Detected:</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#262626]">
                <span>{frameworkIcons[techStack.framework] || '📦'}</span>
                <span className="text-xs text-zinc-300 capitalize">{techStack.framework}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#262626]">
                <span>{cssIcons[techStack.css_framework] || '🎨'}</span>
                <span className="text-xs text-zinc-300 capitalize">{techStack.css_framework}</span>
            </div>
            {techStack.typescript && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span>📘</span>
                    <span className="text-xs text-blue-400">TypeScript</span>
                </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="text-xs text-green-400">{Math.round(techStack.confidence * 100)}% confident</span>
            </div>
        </div>
    );
}

// TechStackCard - Full card view
interface TechStackCardProps {
    techStack: TechStack;
    agent: Agent | null;
}

function TechStackCard({ techStack, agent }: TechStackCardProps) {
    return (
        <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: agent?.color ? `${agent.color}20` : '#ec489920' }}
            >
                🔍
            </div>
            <div className="flex-1 p-4 rounded-xl bg-[#1a1a1a] border border-[#262626] space-y-3">
                <p className="text-sm text-zinc-300">Detected your project stack:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#141414] border border-[#262626]">
                        <span className="text-zinc-500">Framework</span>
                        <p className="text-zinc-200 capitalize font-medium">{techStack.framework}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141414] border border-[#262626]">
                        <span className="text-zinc-500">CSS</span>
                        <p className="text-zinc-200 capitalize font-medium">{techStack.css_framework}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141414] border border-[#262626]">
                        <span className="text-zinc-500">TypeScript</span>
                        <p className="text-zinc-200 font-medium">{techStack.typescript ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141414] border border-[#262626]">
                        <span className="text-zinc-500">Dark Mode</span>
                        <p className="text-zinc-200 font-medium">{techStack.dark_mode_supported ? 'Supported' : 'No'}</p>
                    </div>
                </div>
                {techStack.ui_libraries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {techStack.ui_libraries.map((lib) => (
                            <span key={lib} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs">
                                {lib}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// FileGeneratedCard
interface FileGeneratedCardProps {
    file: GeneratedFile;
    agent: Agent | null;
}

function FileGeneratedCard({ file, agent }: FileGeneratedCardProps) {
    return (
        <div className="flex gap-3 animate-in slide-in-from-right-4 duration-300">
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-green-500/20"
            >
                ✓
            </div>
            <div className="flex-1 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{getFileIcon(file.language)}</span>
                    <span className="text-sm text-green-400 font-medium">{file.component_name || file.path.split('/').pop()}</span>
                    <span className="text-xs text-zinc-500">{file.line_count} lines</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 font-mono truncate">{file.path}</p>
            </div>
        </div>
    );
}

// DesignCompleteCard
interface DesignCompleteCardProps {
    result: DesignResult;
    agent: Agent | null;
}

function DesignCompleteCard({ result, agent }: DesignCompleteCardProps) {
    return (
        <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: agent?.color ? `${agent.color}20` : '#ec489920' }}
            >
                🎉
            </div>
            <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                <p className="text-sm text-zinc-200 font-medium mb-3">Design Complete!</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-2xl font-bold text-pink-400">{result.total_files}</p>
                        <p className="text-xs text-zinc-500">Files</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-purple-400">{result.total_lines}</p>
                        <p className="text-xs text-zinc-500">Lines</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-400">{(result.duration_ms / 1000).toFixed(1)}s</p>
                        <p className="text-xs text-zinc-500">Duration</p>
                    </div>
                </div>
                {result.components_created.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#262626]">
                        <p className="text-xs text-zinc-500 mb-2">Components created:</p>
                        <div className="flex flex-wrap gap-1">
                            {result.components_created.map((comp) => (
                                <span key={comp} className="px-2 py-0.5 rounded bg-[#262626] text-zinc-300 text-xs">
                                    {comp}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}