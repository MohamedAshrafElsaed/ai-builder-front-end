"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";

interface ChatMessagesProps {
    chat: ReturnType<typeof useChat>;
}

export function ChatMessages({ chat }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages, chat.streamingAnswer, chat.currentThought]);

    return (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Empty State */}
                {chat.messages.length === 0 && !chat.isProcessing && (
                    <EmptyState onSuggestionClick={(msg) => chat.sendMessage(msg)} />
                )}

                {/* Messages */}
                {chat.messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        activeAgent={chat.activeAgent}
                    />
                ))}

                {/* Streaming Answer */}
                {chat.streamingAnswer && (
                    <div className="flex gap-3 animate-in fade-in duration-200">
                        <AgentAvatar agent={chat.activeAgent} />
                        <div className="flex-1 max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-md bg-bg-elevated border border-border-subtle">
                            <p className="text-sm text-text-primary whitespace-pre-wrap">
                                {chat.streamingAnswer}
                            </p>
                            <span className="inline-block w-2 h-4 ml-1 bg-accent-primary animate-pulse rounded" />
                        </div>
                    </div>
                )}

                {/* Thinking Indicator */}
                {chat.currentThought && chat.status !== "complete" && !chat.streamingAnswer && (
                    <ThinkingIndicator thought={chat.currentThought} agent={chat.activeAgent} />
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
    onSuggestionClick: (message: string) => void;
}

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
    const suggestions = [
        "Refactor the UserController to use repository pattern",
        "Add authentication middleware to API routes",
        "Create a new service class for payment processing",
        "Fix the failing tests in the OrderController",
    ];

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20 flex items-center justify-center mb-6">
                <SparklesIcon className="w-8 h-8 text-accent-primary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
                How can I help you today?
            </h2>
            <p className="text-sm text-text-secondary mb-8 max-w-md">
                I can help you write code, refactor existing files, fix bugs, and explain complex logic in your project.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestions.map((suggestion, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="p-3 text-left text-sm rounded-xl bg-bg-elevated border border-border-subtle hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-200 group"
                    >
                        <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                            {suggestion}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Agent Avatar
// ============================================================================

import { AgentInfo, getAgentColor, getAgentEmoji } from "@/types/chat";

function AgentAvatar({ agent }: { agent: AgentInfo | null }) {
    const color = agent ? getAgentColor(agent.agent_type) : "#8B5CF6";
    const emoji = agent ? getAgentEmoji(agent.agent_type) : "🤖";

    return (
        <div
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm border"
            style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
            }}
        >
            {emoji}
        </div>
    );
}

// ============================================================================
// Thinking Indicator
// ============================================================================

function ThinkingIndicator({ thought, agent }: { thought: string; agent: AgentInfo | null }) {
    return (
        <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="relative">
                <AgentAvatar agent={agent} />
                <span className="absolute inset-0 rounded-xl animate-ping opacity-20 bg-accent-primary" />
            </div>
            <div className="flex-1">
                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-md bg-bg-elevated border border-border-subtle">
                    <div className="flex gap-1">
                        <span
                            className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </div>
                    <p className="text-sm text-text-secondary">{thought}</p>
                </div>
            </div>
        </div>
    );
}

// Re-export for use elsewhere
export { AgentAvatar, ThinkingIndicator };

// ============================================================================
// Icons
// ============================================================================

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
    );
}