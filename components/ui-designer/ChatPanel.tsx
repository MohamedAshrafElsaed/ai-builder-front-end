"use client";

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Agent, DesignStatus, Message, TechStack } from '@/types/ui-designer';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { TechStackBadge } from './TechStackBadge';
import { SparklesIcon, SendIcon, XIcon, ZapIcon } from '@/components/ui/Icons';

interface ChatPanelProps {
    agent: Agent | null;
    messages: Message[];
    currentThought: string;
    techStack: TechStack | null;
    status: DesignStatus;
    isGenerating: boolean;
    onSendMessage: (prompt: string) => void;
    onCancel: () => void;
}

const SUGGESTIONS = [
    "Dashboard with stats cards",
    "Settings page with forms",
    "Data table with filters",
    "Sidebar navigation",
];

export function ChatPanel({
                              agent,
                              messages,
                              currentThought,
                              techStack,
                              status,
                              isGenerating,
                              onSendMessage,
                              onCancel,
                          }: ChatPanelProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentThought]);

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = () => {
        const trimmed = input.trim();
        if (!trimmed || isGenerating) return;
        onSendMessage(trimmed);
        setInput('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'generating': return 'Generating...';
            case 'connecting': return 'Connecting...';
            case 'detecting': return 'Analyzing...';
            case 'complete': return 'Ready';
            case 'error': return 'Error';
            default: return 'Online';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'generating':
            case 'connecting':
            case 'detecting': return 'bg-accent-primary';
            case 'complete': return 'bg-status-success';
            case 'error': return 'bg-status-error';
            default: return 'bg-status-success';
        }
    };

    return (
        <div className="flex flex-col h-full bg-bg-base">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle bg-bg-surface">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20 flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-surface ${getStatusColor()} ${status === 'generating' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-text-primary">{agent?.name || 'Palette'}</h2>
                        <p className="text-xs text-text-muted">{getStatusText()}</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="px-4 py-4 space-y-4">
                    {techStack && <TechStackBadge techStack={techStack} />}

                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} agent={agent} />
                    ))}

                    {currentThought && status !== 'complete' && (
                        <ThinkingIndicator thought={currentThought} agent={agent} />
                    )}

                    {status === 'idle' && messages.length <= 2 && (
                        <div className="pt-6">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-3">Quick start</p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(s);
                                            inputRef.current?.focus();
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary bg-bg-surface border border-border-subtle rounded-lg hover:bg-bg-elevated hover:text-text-primary hover:border-border-default transition-all"
                                    >
                                        <ZapIcon className="w-3 h-3" />
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t border-border-subtle bg-bg-surface">
                <div className="relative flex items-end gap-2 p-1.5 bg-bg-base border border-border-default rounded-xl focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/20 transition-all">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe the UI you want to create..."
                        disabled={isGenerating}
                        rows={1}
                        className="flex-1 px-3 py-2.5 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none disabled:opacity-50"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                        onInput={(e) => {
                            const t = e.target as HTMLTextAreaElement;
                            t.style.height = '44px';
                            t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                        }}
                    />
                    {isGenerating ? (
                        <button
                            onClick={onCancel}
                            className="p-2.5 m-0.5 text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                            title="Cancel generation"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!input.trim()}
                            className="p-2.5 m-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-accent-primary/25 transition-all"
                            title="Send message"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <p className="mt-2 text-[10px] text-text-muted text-center">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle text-text-secondary">⌘K</kbd> to focus
                </p>
            </div>
        </div>
    );
}