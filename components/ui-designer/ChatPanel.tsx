// components/ui-designer/ChatPanel.tsx
"use client";

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { Agent, Message, TechStack, DesignStatus } from '@/types/ui-designer';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { TechStackBadge } from './TechStackBadge';

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
    "Create a dashboard with stats cards and charts",
    "Design a settings page with form sections",
    "Build a data table with sorting and filtering",
    "Create a sidebar navigation component",
    "Design a modal dialog with form inputs",
    "Build a file upload component with preview",
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
    const [userScrolled, setUserScrolled] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom (smart scroll)
    useEffect(() => {
        if (!userScrolled && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, currentThought, userScrolled]);

    // Handle scroll detection
    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        setUserScrolled(!isAtBottom);
    };

    // Focus input on keyboard shortcut
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
        setUserScrolled(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSuggestion = (suggestion: string) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Chat Header */}
            <ChatHeader agent={agent} status={status} />

            {/* Messages */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
                onScroll={handleScroll}
            >
                {/* Tech Stack Badge */}
                {techStack && <TechStackBadge techStack={techStack} />}

                {/* Messages */}
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        agent={agent}
                    />
                ))}

                {/* Thinking Indicator */}
                {currentThought && status !== 'complete' && (
                    <ThinkingIndicator thought={currentThought} agent={agent} />
                )}

                {/* Suggestions (show when idle and no messages) */}
                {status === 'idle' && messages.length <= 2 && (
                    <div className="space-y-2 pt-4">
                        <p className="text-xs text-zinc-500 font-medium">Try these:</p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.slice(0, 4).map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestion(suggestion)}
                                    className="px-3 py-2 text-xs text-zinc-400 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:bg-[#262626] hover:text-zinc-300 transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-[#1f1f1f] bg-[#0a0a0a]">
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe the UI you want to create..."
                        disabled={isGenerating}
                        rows={3}
                        className="w-full px-4 py-3 pr-24 bg-[#141414] border border-[#262626] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 disabled:opacity-50 transition-all"
                    />

                    <div className="absolute right-2 bottom-2 flex items-center gap-2">
                        {isGenerating ? (
                            <button
                                onClick={onCancel}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors"
                            >
                                Cancel
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!input.trim()}
                                className="px-4 py-1.5 text-xs font-medium text-white bg-pink-600 rounded-md hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                            >
                                <span>Send</span>
                                <kbd className="text-[10px] opacity-60">⌘↵</kbd>
                            </button>
                        )}
                    </div>
                </div>

                <p className="mt-2 text-[10px] text-zinc-600 text-center">
                    Press <kbd className="px-1 py-0.5 bg-[#1a1a1a] rounded text-zinc-500">⌘ + Enter</kbd> to send
                </p>
            </div>
        </div>
    );
}

interface ChatHeaderProps {
    agent: Agent | null;
    status: DesignStatus;
}

function ChatHeader({ agent, status }: ChatHeaderProps) {
    const statusColors: Record<DesignStatus, string> = {
        idle: 'bg-zinc-500',
        connecting: 'bg-yellow-500 animate-pulse',
        detecting: 'bg-blue-500 animate-pulse',
        optimizing: 'bg-purple-500 animate-pulse',
        generating: 'bg-pink-500 animate-pulse',
        complete: 'bg-green-500',
        error: 'bg-red-500',
        cancelled: 'bg-zinc-500',
    };

    const statusLabels: Record<DesignStatus, string> = {
        idle: 'Ready',
        connecting: 'Connecting...',
        detecting: 'Detecting stack...',
        optimizing: 'Optimizing...',
        generating: 'Generating...',
        complete: 'Complete',
        error: 'Error',
        cancelled: 'Cancelled',
    };

    return (
        <div className="flex-shrink-0 h-16 flex items-center gap-3 px-4 border-b border-[#1f1f1f] bg-[#141414]">
            {/* Agent Avatar */}
            <div className="relative">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: agent?.color ? `${agent.color}20` : '#ec489920' }}
                >
                    {agent?.avatar_emoji || '🎨'}
                </div>
                <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141414] ${statusColors[status]}`}
                />
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-zinc-100 truncate">
                    {agent?.name || 'Palette'}
                </h2>
                <p className="text-xs text-zinc-500">
                    {statusLabels[status]}
                </p>
            </div>
        </div>
    );
}