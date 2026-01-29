"use client";

import { useMemo } from "react";
import { AgentInfo, ChatStatus, Plan, getStatusLabel, getAgentColor, getAgentEmoji, getActionIcon } from "@/types/chat";

// ============================================================================
// Types
// ============================================================================

interface AgentStatusProps {
    agent: AgentInfo | null;
    status: ChatStatus;
    currentThought: string;
    currentPlan?: Plan | null;
    currentStepIndex?: number;
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function AgentStatus({
                                agent,
                                status,
                                currentThought,
                                currentPlan,
                                currentStepIndex = 0,
                                className = "",
                            }: AgentStatusProps) {
    // Don't show anything when idle with no agent
    if (!agent && status === "idle") return null;

    const isThinking = ["analyzing", "planning", "validating", "streaming"].includes(status);
    const isExecuting = status === "executing";

    // Show plan progress during execution
    if (isExecuting && currentPlan && currentPlan.steps.length > 0) {
        return (
            <PlanProgress
                plan={currentPlan}
                currentStepIndex={currentStepIndex}
                agent={agent}
                className={className}
            />
        );
    }

    // Show thinking/processing status
    return (
        <div className={`flex-shrink-0 px-4 py-3 border-t border-border-subtle bg-gradient-to-r from-bg-surface/80 to-bg-elevated/50 backdrop-blur-sm ${className}`}>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                    {/* Agent Avatar */}
                    <AgentAvatar agent={agent} status={status} />

                    {/* Status Content */}
                    <div className="flex-1 min-w-0">
                        {agent && (
                            <p className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                                <span style={{ color: getAgentColor(agent.agent_type) }}>{agent.name}</span>
                                <span className="text-text-muted">•</span>
                                <span className="text-text-muted">{agent.role}</span>
                            </p>
                        )}

                        {currentThought ? (
                            <p className="text-sm text-text-primary mt-0.5 truncate">{currentThought}</p>
                        ) : isThinking ? (
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-text-muted">{getStatusDescription(status)}</span>
                                <ThinkingDots />
                            </div>
                        ) : (
                            <p className="text-sm text-text-muted mt-0.5">{getStatusLabel(status)}</p>
                        )}
                    </div>

                    {/* Status indicator */}
                    <StatusPill status={status} />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Plan Progress Component
// ============================================================================

interface PlanProgressProps {
    plan: Plan;
    currentStepIndex: number;
    agent: AgentInfo | null;
    className?: string;
}

function PlanProgress({ plan, currentStepIndex, agent, className = "" }: PlanProgressProps) {
    const progress = useMemo(() => {
        if (plan.steps.length === 0) return 0;
        return Math.round(((currentStepIndex + 1) / plan.steps.length) * 100);
    }, [currentStepIndex, plan.steps.length]);

    const currentStep = plan.steps[currentStepIndex];

    return (
        <div className={`flex-shrink-0 px-4 py-3 border-t border-border-subtle bg-gradient-to-r from-bg-surface/80 to-bg-elevated/50 backdrop-blur-sm ${className}`}>
            <div className="max-w-4xl mx-auto space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <AgentAvatar agent={agent} status="executing" />
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-text-secondary">
                                {agent ? (
                                    <>
                                        <span style={{ color: getAgentColor(agent.agent_type) }}>{agent.name}</span>
                                        <span className="text-text-muted"> • Executing</span>
                                    </>
                                ) : (
                                    "Executing Plan"
                                )}
                            </p>
                            <p className="text-sm text-text-primary truncate">{plan.summary}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-text-muted">
                            {currentStepIndex + 1}/{plan.steps.length}
                        </span>
                        <span className="text-xs font-medium text-accent-primary">{progress}%</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Current Step */}
                {currentStep && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-text-muted">{getActionIcon(currentStep.action)}</span>
                        <span className="text-accent-primary font-medium">{currentStep.action}</span>
                        <span className="font-mono text-text-secondary truncate">{currentStep.file}</span>
                        <LoaderIcon className="h-3 w-3 text-accent-primary animate-spin ml-auto shrink-0" />
                    </div>
                )}

                {/* Step indicators */}
                <div className="flex gap-1">
                    {plan.steps.map((step, i) => (
                        <div
                            key={i}
                            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                                i < currentStepIndex
                                    ? "bg-status-success"
                                    : i === currentStepIndex
                                        ? "bg-accent-primary animate-pulse"
                                        : "bg-bg-elevated"
                            }`}
                            title={`${step.action}: ${step.file}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function AgentAvatar({ agent, status }: { agent: AgentInfo | null; status: ChatStatus }) {
    const isActive = ["analyzing", "planning", "executing", "validating", "streaming"].includes(status);

    if (agent) {
        return (
            <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border shrink-0 transition-all ${isActive ? "animate-pulse" : ""}`}
                style={{
                    backgroundColor: `${getAgentColor(agent.agent_type)}15`,
                    borderColor: `${getAgentColor(agent.agent_type)}30`,
                }}
            >
                {getAgentEmoji(agent.agent_type)}
            </div>
        );
    }

    return (
        <div className={`w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0 ${isActive ? "animate-pulse" : ""}`}>
            <LoaderIcon className="h-4 w-4 text-accent-primary animate-spin" />
        </div>
    );
}

function ThinkingDots() {
    return (
        <div className="flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 bg-accent-primary rounded-full"
                    style={{
                        animation: "bounce 1s ease-in-out infinite",
                        animationDelay: `${i * 150}ms`,
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-4px); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function StatusPill({ status }: { status: ChatStatus }) {
    const config: Record<string, { bg: string; text: string; dot: boolean }> = {
        connecting: { bg: "bg-status-info/10", text: "text-status-info", dot: true },
        analyzing: { bg: "bg-status-info/10", text: "text-status-info", dot: true },
        planning: { bg: "bg-status-info/10", text: "text-status-info", dot: true },
        executing: { bg: "bg-status-warning/10", text: "text-status-warning", dot: true },
        validating: { bg: "bg-status-warning/10", text: "text-status-warning", dot: true },
        streaming: { bg: "bg-accent-primary/10", text: "text-accent-primary", dot: true },
        awaiting_approval: { bg: "bg-status-warning/10", text: "text-status-warning", dot: false },
        complete: { bg: "bg-status-success/10", text: "text-status-success", dot: false },
        error: { bg: "bg-status-error/10", text: "text-status-error", dot: false },
    };

    const { bg, text, dot } = config[status] || { bg: "bg-bg-elevated", text: "text-text-muted", dot: false };

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} shrink-0`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${text.replace("text-", "bg-")} animate-pulse`} />}
            <span className={`text-[10px] font-medium uppercase tracking-wider ${text}`}>
                {getStatusLabel(status)}
            </span>
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusDescription(status: ChatStatus): string {
    const descriptions: Record<ChatStatus, string> = {
        idle: "Ready",
        connecting: "Establishing connection",
        analyzing: "Understanding your request",
        planning: "Creating execution plan",
        executing: "Making changes to code",
        validating: "Checking code quality",
        streaming: "Generating response",
        awaiting_approval: "Waiting for your approval",
        complete: "Task completed",
        error: "Something went wrong",
    };
    return descriptions[status] || status;
}

// ============================================================================
// Icons
// ============================================================================

function LoaderIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

// Re-export for external use
export { AgentAvatar, ThinkingDots };