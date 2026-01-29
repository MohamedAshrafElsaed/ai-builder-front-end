"use client";

import { Agent, Message, TechStack, GeneratedFile, DesignResult } from '@/types/ui-designer';
import {
    AlertCircleIcon, CheckCircleIcon, FileCodeIcon, SparklesIcon,
    SearchIcon, ReactIcon, VueIcon, TypeScriptIcon, CssIcon,
    ClockIcon, LayersIcon, BoxIcon, ZapIcon
} from '@/components/ui/Icons';

interface MessageBubbleProps {
    message: Message;
    agent: Agent | null;
}

export function MessageBubble({ message, agent }: MessageBubbleProps) {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';

    if (isUser) {
        return (
            <div className="flex justify-end animate-in slide-in-from-right-2 duration-200">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-md bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/20">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-status-error/15 border border-status-error/20 flex items-center justify-center">
                    <AlertCircleIcon className="w-4 h-4 text-status-error" />
                </div>
                <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-md bg-status-error/10 border border-status-error/20">
                    <p className="text-sm text-status-error">{message.content}</p>
                    {message.metadata?.error && (
                        <p className="mt-1 text-xs text-status-error/70 font-mono">{message.metadata.error}</p>
                    )}
                </div>
            </div>
        );
    }

    if (message.type === 'tech_detected' && message.metadata?.techStack) {
        return <TechStackCard techStack={message.metadata.techStack} agent={agent} />;
    }

    if (message.type === 'file_generated' && message.metadata?.file) {
        return <FileGeneratedCard file={message.metadata.file} />;
    }

    if (message.type === 'design_complete' && message.metadata?.result) {
        return <DesignCompleteCard result={message.metadata.result} agent={agent} />;
    }

    if (message.type === 'agent_thinking') return null;

    return (
        <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
            <AgentAvatar agent={agent} />
            <div className="flex-1 max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-md bg-bg-elevated border border-border-subtle">
                <p className="text-sm text-text-primary whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
}

function AgentAvatar({ agent, size = 'md' }: { agent: Agent | null; size?: 'sm' | 'md' }) {
    const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
    const iconSize = size === 'sm' ? 12 : 16;

    return (
        <div
            className={`flex-shrink-0 ${sizeClasses} rounded-xl flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20`}
        >
            <SparklesIcon className="text-accent-primary" size={iconSize} />
        </div>
    );
}

export function ThinkingIndicator({ thought, agent }: { thought: string; agent: Agent | null }) {
    return (
        <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20 relative">
                <SparklesIcon className="w-4 h-4 text-accent-primary animate-pulse" />
                <span className="absolute inset-0 rounded-xl animate-ping opacity-20 bg-accent-primary" />
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-md bg-bg-elevated border border-border-subtle">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm text-text-secondary animate-pulse">{thought}</p>
                </div>
            </div>
        </div>
    );
}

export function TechStackBadge({ techStack }: { techStack: TechStack }) {
    const getFrameworkIcon = (framework: string) => {
        switch (framework) {
            case 'react': return <ReactIcon className="w-3.5 h-3.5" />;
            case 'vue': return <VueIcon className="w-3.5 h-3.5" />;
            default: return <BoxIcon className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="flex items-center gap-2 py-2 animate-in slide-in-from-left-2 duration-200 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Detected</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated border border-border-subtle">
                {getFrameworkIcon(techStack.framework)}
                <span className="text-xs text-text-secondary capitalize">{techStack.framework}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated border border-border-subtle">
                <CssIcon className="w-3.5 h-3.5" />
                <span className="text-xs text-text-secondary capitalize">{techStack.css_framework}</span>
            </div>
            {techStack.typescript && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-info/10 border border-status-info/20">
                    <TypeScriptIcon className="w-3.5 h-3.5 text-status-info" />
                    <span className="text-xs text-status-info">TypeScript</span>
                </div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/20">
                <span className="text-xs text-status-success">{Math.round(techStack.confidence * 100)}%</span>
            </div>
        </div>
    );
}

function TechStackCard({ techStack, agent }: { techStack: TechStack; agent: Agent | null }) {
    return (
        <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-status-info/15 border border-status-info/20 flex items-center justify-center">
                <SearchIcon className="w-4 h-4 text-status-info" />
            </div>
            <div className="flex-1 p-4 rounded-xl bg-bg-elevated border border-border-subtle space-y-3">
                <p className="text-sm text-text-secondary">Detected your project stack:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <InfoBox label="Framework" value={techStack.framework} />
                    <InfoBox label="CSS" value={techStack.css_framework} />
                    <InfoBox label="TypeScript" value={techStack.typescript ? 'Yes' : 'No'} />
                    <InfoBox label="Dark Mode" value={techStack.dark_mode_supported ? 'Supported' : 'No'} />
                </div>
                {techStack.ui_libraries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {techStack.ui_libraries.map((lib) => (
                            <span key={lib} className="px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary text-xs border border-accent-primary/20">
                                {lib}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle">
            <span className="text-text-muted text-[10px] uppercase tracking-wider">{label}</span>
            <p className="text-text-primary capitalize font-medium mt-0.5">{value}</p>
        </div>
    );
}

function FileGeneratedCard({ file }: { file: GeneratedFile }) {
    return (
        <div className="flex gap-3 animate-in slide-in-from-right-2 duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-status-success/15 border border-status-success/20 flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 text-status-success" />
            </div>
            <div className="flex-1 p-3 rounded-xl bg-status-success/5 border border-status-success/20">
                <div className="flex items-center gap-2">
                    <FileCodeIcon className="w-4 h-4 text-status-success" />
                    <span className="text-sm text-status-success font-medium">{file.component_name || file.path.split('/').pop()}</span>
                    <span className="text-xs text-text-muted">{file.line_count} lines</span>
                </div>
                <p className="mt-1 text-xs text-text-muted font-mono truncate">{file.path}</p>
            </div>
        </div>
    );
}

function DesignCompleteCard({ result, agent }: { result: DesignResult; agent: Agent | null }) {
    return (
        <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
            <AgentAvatar agent={agent} />
            <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20">
                <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-4 h-4 text-accent-primary" />
                    <p className="text-sm text-text-primary font-medium">Design Complete!</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <StatBox icon={<LayersIcon className="w-4 h-4" />} value={result.total_files} label="Files" color="accent" />
                    <StatBox icon={<FileCodeIcon className="w-4 h-4" />} value={result.total_lines} label="Lines" color="secondary" />
                    <StatBox icon={<ClockIcon className="w-4 h-4" />} value={`${(result.duration_ms / 1000).toFixed(1)}s`} label="Time" color="success" />
                </div>
                {result.components_created.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                        <p className="text-xs text-text-muted mb-2">Components created:</p>
                        <div className="flex flex-wrap gap-1">
                            {result.components_created.map((comp) => (
                                <span key={comp} className="px-2 py-0.5 rounded bg-bg-surface text-text-secondary text-xs border border-border-subtle">
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

function StatBox({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: 'accent' | 'secondary' | 'success' }) {
    const colors = {
        accent: 'text-accent-primary',
        secondary: 'text-accent-secondary',
        success: 'text-status-success',
    };

    return (
        <div className="p-2 rounded-lg bg-bg-surface/50 border border-border-subtle">
            <div className={`${colors[color]} mb-1 flex justify-center`}>{icon}</div>
            <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
        </div>
    );
}