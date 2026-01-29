"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import {
    ChatMessage,
    AgentInfo,
    ExecutionResult,
    ValidationResult,
    getAgentColor,
    getAgentEmoji,
    getActionIcon,
    formatMessageTime,
} from "@/types/chat";

interface MessageBubbleProps {
    message: ChatMessage;
    activeAgent: AgentInfo | null;
}

export function MessageBubble({ message, activeAgent }: MessageBubbleProps) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";

    // User message
    if (isUser) {
        return (
            <div className="flex justify-end animate-in slide-in-from-right-2 duration-200">
                <div className="max-w-[85%] group">
                    <div className="px-4 py-3 rounded-2xl rounded-tr-md bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/20">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatMessageTime(message.created_at)}
                    </p>
                </div>
            </div>
        );
    }

    // System message
    if (isSystem) {
        return (
            <div className="flex justify-center animate-in fade-in duration-200">
                <div className="px-4 py-2 rounded-full bg-bg-elevated border border-border-subtle">
                    <p className="text-xs text-text-muted">{message.content}</p>
                </div>
            </div>
        );
    }

    // Assistant message
    return (
        <div className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
            <AgentAvatar agent={activeAgent} />
            <div className="flex-1 space-y-3 group">
                <div className="max-w-[85%]">
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-bg-elevated border border-border-subtle">
                        <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                            {message.content}
                        </p>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatMessageTime(message.created_at)}
                    </p>
                </div>

                {/* Code Changes Card */}
                {message.code_changes && message.code_changes.results.length > 0 && (
                    <CodeChangesCard
                        results={message.code_changes.results}
                        validation={message.code_changes.validation}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Agent Avatar
// ============================================================================

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
// Code Changes Card
// ============================================================================

interface CodeChangesCardProps {
    results: ExecutionResult[];
    validation: ValidationResult;
}

function CodeChangesCard({ results, validation }: CodeChangesCardProps) {
    const [expanded, setExpanded] = useState(false);
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return (
        <div className="max-w-[85%] rounded-xl border border-border-subtle overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-bg-elevated hover:bg-bg-hover transition-colors"
            >
                <div className="flex items-center gap-3">
                    <FileCodeIcon className="h-4 w-4 text-accent-primary" />
                    <span className="text-sm font-medium text-text-primary">
                        {results.length} file{results.length !== 1 ? "s" : ""} changed
                    </span>
                    {successCount > 0 && (
                        <Badge variant="success" className="text-xs">
                            {successCount} success
                        </Badge>
                    )}
                    {failedCount > 0 && (
                        <Badge variant="error" className="text-xs">
                            {failedCount} failed
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={validation.approved ? "success" : "warning"} className="text-xs">
                        {validation.approved ? "Validated" : `${validation.issues.length} issues`}
                    </Badge>
                    <ChevronDownIcon
                        className={`h-4 w-4 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-border-subtle">
                    {/* File List */}
                    <div className="divide-y divide-border-subtle">
                        {results.map((result, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 px-4 py-2.5 bg-bg-base"
                            >
                                <span className="text-sm">{getActionIcon(result.action)}</span>
                                <span className="text-sm text-text-primary font-mono flex-1 truncate">
                                    {result.file}
                                </span>
                                {result.success ? (
                                    <CheckIcon className="h-4 w-4 text-status-success" />
                                ) : (
                                    <XIcon className="h-4 w-4 text-status-error" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Validation Issues */}
                    {validation.issues.length > 0 && (
                        <div className="p-3 bg-status-warning/5 border-t border-border-subtle">
                            <p className="text-xs font-medium text-status-warning mb-2">
                                Validation Issues
                            </p>
                            <div className="space-y-1">
                                {validation.issues.slice(0, 3).map((issue, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span
                                            className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                issue.severity === "error"
                                                    ? "bg-status-error"
                                                    : issue.severity === "warning"
                                                        ? "bg-status-warning"
                                                        : "bg-status-info"
                                            }`}
                                        />
                                        <span className="text-text-secondary">{issue.message}</span>
                                    </div>
                                ))}
                                {validation.issues.length > 3 && (
                                    <p className="text-xs text-text-muted pl-3.5">
                                        +{validation.issues.length - 3} more issues
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Icons
// ============================================================================

function FileCodeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2v6h6m-8 4l-2 2 2 2m4-4l2 2-2 2" />
        </svg>
    );
}

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}