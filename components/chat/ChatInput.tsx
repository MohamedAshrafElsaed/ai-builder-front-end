"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/hooks/useChat";

interface ChatInputProps {
    chat: ReturnType<typeof useChat>;
    inputId?: string;
}

export function ChatInput({ chat, inputId = "chat-input" }: ChatInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        const trimmed = input.trim();
        if (!trimmed || !chat.canSendMessage) return;
        chat.sendMessage(trimmed);
        setInput("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    return (
        <div className="flex-shrink-0 border-t border-border-subtle bg-bg-surface/50 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto p-4">
                <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            id={inputId}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                chat.canSendMessage
                                    ? "Ask anything about your code..."
                                    : "Processing..."
                            }
                            disabled={!chat.canSendMessage}
                            rows={1}
                            className="w-full px-4 py-3 pr-24 bg-bg-elevated border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all scrollbar-thin"
                        />
                        <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                            <span className="text-xs text-text-muted hidden sm:flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-bg-base border border-border-subtle text-[10px]">
                                    ↵
                                </kbd>
                                <span>to send</span>
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={!input.trim() || !chat.canSendMessage}
                        className="h-12 px-4"
                    >
                        {chat.isProcessing ? (
                            <LoaderIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <SendIcon className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline ml-2">Send</span>
                    </Button>
                </div>

                {/* Hints */}
                <div className="flex items-center justify-between mt-2 px-1">
                    <p className="text-xs text-text-muted">
                        <kbd className="px-1 py-0.5 rounded bg-bg-elevated border border-border-subtle text-[10px] mr-1">
                            ⌘K
                        </kbd>
                        Focus input
                    </p>
                    {chat.error && (
                        <button
                            onClick={chat.retryLastMessage}
                            className="text-xs text-status-error hover:underline"
                        >
                            Retry last message
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Icons
// ============================================================================

function SendIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
    );
}

function LoaderIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}