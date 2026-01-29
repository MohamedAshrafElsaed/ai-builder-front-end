"use client";

import { AgentInfo, ChatStatus, Plan, getStatusLabel, getAgentColor, getAgentEmoji, getActionIcon } from "@/types/chat";

interface AgentStatusProps {
    status: ChatStatus;
    currentThought: string;
    activeAgent: AgentInfo | null;
    currentPlan: Plan | null;
    currentStepIndex: number;
}

export function AgentStatus({
                                status,
                                currentThought,
                                activeAgent,
                                currentPlan,
                                currentStepIndex,
                            }: AgentStatusProps) {
    // Show plan progress during execution
    if (status === "executing" && currentPlan) {
        return (
            <PlanProgress
                plan={currentPlan}
                currentStepIndex={currentStepIndex}
            />
        );
    }

    // Show thinking/processing status
    if (currentThought || status !== "idle") {
        return (
            <div className="flex-shrink-0 px-4 py-3 border-t border-border-subtle bg-bg-surface/50">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3">
                        {/* Agent Avatar */}
                        {activeAgent ? (
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border animate-pulse"
                                style={{
                                    backgroundColor: `${getAgentColor(activeAgent.agent_type)}15`,
                                    borderColor: `${getAgentColor(activeAgent.agent_type)}30`,
                                }}
                            >
                                {getAgentEmoji(activeAgent.agent_type)}
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center animate-pulse">
                                <LoaderIcon className="h-4 w-4 text-accent-primary animate-spin" />
                            </div>
                        )}

                        {/* Status Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary font-medium">
                                {activeAgent?.name || getStatusLabel(status)}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                                {currentThought || getStatusDescription(status)}
                            </p>
                        </div>

                        {/* Progress Indicator */}
                        <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// ============================================================================
// Plan Progress
// ============================================================================

interface PlanProgressProps {
    plan: Plan;
    currentStepIndex: number;
}

function PlanProgress({ plan, currentStepIndex }: PlanProgressProps) {
    const progress = ((currentStepIndex + 1) / plan.steps.length) * 100;

    return (
        <div className="flex-shrink-0 px-4 py-3 border-t border-border-subtle bg-bg-surface/50">
            <div className="max-w-3xl mx-auto space-y-3">
                {/* Progress Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ClipboardListIcon className="h-4 w-4 text-accent-primary" />
                        <span className="text-sm font-medium text-text-primary">Executing Plan</span>
                    </div>
                    <span className="text-xs text-text-muted">
                        Step {currentStepIndex + 1} of {plan.steps.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Current Step */}
                {plan.steps[currentStepIndex] && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-accent-primary/5 border border-accent-primary/20">
                        <span className="text-sm">{getActionIcon(plan.steps[currentStepIndex].action)}</span>
                        <span className="text-sm text-text-primary font-mono flex-1 truncate">
                            {plan.steps[currentStepIndex].file}
                        </span>
                        <LoaderIcon className="h-4 w-4 text-accent-primary animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Helpers
// ============================================================================

function getStatusDescription(status: ChatStatus): string {
    switch (status) {
        case "connecting":
            return "Establishing connection...";
        case "analyzing":
            return "Understanding your request...";
        case "planning":
            return "Creating execution plan...";
        case "executing":
            return "Making changes to files...";
        case "validating":
            return "Checking code quality...";
        case "streaming":
            return "Generating response...";
        default:
            return "";
    }
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

function ClipboardListIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    );
}