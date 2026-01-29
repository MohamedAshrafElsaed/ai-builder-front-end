"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { ChatStatus } from "@/types/chat";

// ============================================================================
// Types
// ============================================================================

interface ChatInputProps {
    onSend: (message: string) => void;
    onCancel: () => void;
    status: ChatStatus;
    isProcessing: boolean;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    interactiveMode: boolean;
    onToggleInteractive: (enabled: boolean) => void;
    onRetry?: () => void;
    hasError?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SUGGESTIONS = [
    "Add authentication to my API",
    "Create a CRUD for products",
    "Fix the N+1 query issue",
    "Add validation to forms",
    "Write tests for UserController",
    "Refactor to repository pattern",
];

const MIN_HEIGHT = 48;
const MAX_HEIGHT = 150; // ~5 lines

// ============================================================================
// Main Component
// ============================================================================

export function ChatInput({
                              onSend,
                              onCancel,
                              status,
                              isProcessing,
                              disabled = false,
                              placeholder = "Ask anything about your codebase...",
                              maxLength,
                              interactiveMode,
                              onToggleInteractive,
                              onRetry,
                              hasError = false,
                          }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    // Detect platform for keyboard shortcuts
    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Global keyboard shortcut (Cmd/Ctrl + K to focus)
    useEffect(() => {
        const handleGlobalKey = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                textareaRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleGlobalKey);
        return () => window.removeEventListener("keydown", handleGlobalKey);
    }, []);

    // Auto-resize textarea
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)}px`;
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [input, adjustHeight]);

    // Handlers
    const handleSubmit = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed || isProcessing || disabled) return;
        onSend(trimmed);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = `${MIN_HEIGHT}px`;
        }
    }, [input, isProcessing, disabled, onSend]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter to send (without shift)
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        // Escape to cancel when processing
        if (e.key === "Escape" && isProcessing) {
            e.preventDefault();
            onCancel();
        }
    }, [handleSubmit, isProcessing, onCancel]);

    const handleSuggestionClick = useCallback((suggestion: string) => {
        setInput(suggestion);
        textareaRef.current?.focus();
    }, []);

    const canSend = input.trim().length > 0 && !isProcessing && !disabled;
    const showCharCount = input.length > 100 || (maxLength && input.length > maxLength * 0.8);
    const isOverLimit = maxLength ? input.length > maxLength : false;

    return (
        <div className="flex-shrink-0 border-t border-border-subtle bg-bg-surface/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto p-4">
                {/* Suggestion chips when empty and idle */}
                {!input && !isProcessing && status === "idle" && (
                    <div className="mb-3 flex flex-wrap gap-2 animate-in fade-in duration-300">
                        {SUGGESTIONS.slice(0, 4).map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary bg-bg-elevated border border-border-subtle rounded-full hover:bg-bg-hover hover:text-text-primary hover:border-border-default transition-all duration-150"
                            >
                                <ZapIcon className="w-3 h-3 text-accent-primary/60 group-hover:text-accent-primary transition-colors" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input area */}
                <div
                    ref={formRef}
                    className={`relative flex items-end gap-2 p-1.5 bg-bg-base border rounded-xl transition-all duration-200 ${
                        isFocused
                            ? "border-accent-primary ring-2 ring-accent-primary/20"
                            : "border-border-default hover:border-border-hover"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {/* Future: File upload button */}
                    <button
                        type="button"
                        className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                        aria-label="Attach file (coming soon)"
                        title="Attach file (coming soon)"
                        disabled
                    >
                        <PaperclipIcon className="h-5 w-5" />
                    </button>

                    {/* Textarea */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={isProcessing ? "Processing..." : placeholder}
                            disabled={disabled || isProcessing}
                            rows={1}
                            className="w-full px-3 py-2.5 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none disabled:cursor-not-allowed scrollbar-thin"
                            style={{ minHeight: `${MIN_HEIGHT}px`, maxHeight: `${MAX_HEIGHT}px` }}
                            aria-label="Chat message input"
                        />

                        {/* Character count */}
                        {showCharCount && (
                            <span className={`absolute bottom-2 right-2 text-[10px] transition-colors ${isOverLimit ? "text-status-error" : "text-text-muted"}`}>
                                {input.length}{maxLength ? `/${maxLength}` : ""}
                            </span>
                        )}
                    </div>

                    {/* Send / Cancel button */}
                    {isProcessing ? (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={onCancel}
                            className="h-10 w-10 shrink-0 rounded-lg"
                            aria-label="Cancel request"
                        >
                            <StopIcon className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSend || isOverLimit}
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-lg"
                            aria-label="Send message"
                        >
                            <SendIcon className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Bottom options bar */}
                <div className="mt-2 flex items-center justify-between gap-4">
                    {/* Interactive mode toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={interactiveMode}
                                onChange={(e) => onToggleInteractive(e.target.checked)}
                                className="sr-only peer"
                                aria-describedby="interactive-mode-desc"
                            />
                            <div className="w-8 h-[18px] bg-bg-elevated rounded-full peer-checked:bg-accent-primary transition-colors" />
                            <div className="absolute left-0.5 top-0.5 w-[14px] h-[14px] bg-white rounded-full shadow-sm peer-checked:translate-x-[14px] transition-transform" />
                        </div>
                        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                            Interactive mode
                        </span>
                        <span id="interactive-mode-desc" className="sr-only">
                            When enabled, you will be asked to approve the plan before execution
                        </span>
                    </label>

                    {/* Right side: error retry + keyboard hints */}
                    <div className="flex items-center gap-3">
                        {hasError && onRetry && (
                            <button
                                onClick={onRetry}
                                className="text-xs text-status-error hover:underline transition-colors"
                            >
                                Retry last message
                            </button>
                        )}

                        <div className="hidden sm:flex items-center gap-2 text-[10px] text-text-muted">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded border border-border-subtle font-mono">
                                    {isMac ? "⌘" : "Ctrl"}K
                                </kbd>
                                <span>focus</span>
                            </span>
                            <span className="text-border-subtle">•</span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded border border-border-subtle font-mono">↵</kbd>
                                <span>send</span>
                            </span>
                            <span className="text-border-subtle">•</span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded border border-border-subtle font-mono">⇧↵</kbd>
                                <span>newline</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Processing status indicator */}
                {isProcessing && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-text-muted animate-in fade-in duration-200">
                        <LoaderIcon className="h-3.5 w-3.5 animate-spin text-accent-primary" />
                        <span>{getStatusText(status)}</span>
                        <span className="text-text-muted/60">• Press Esc to cancel</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusText(status: ChatStatus): string {
    const labels: Record<ChatStatus, string> = {
        idle: "Ready",
        connecting: "Connecting...",
        analyzing: "Analyzing your request...",
        planning: "Creating execution plan...",
        executing: "Executing changes...",
        validating: "Validating code...",
        streaming: "Generating response...",
        awaiting_approval: "Waiting for approval...",
        complete: "Complete",
        error: "Error occurred",
    };
    return labels[status] || status;
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

function StopIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
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

function ZapIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}

function PaperclipIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    );
}