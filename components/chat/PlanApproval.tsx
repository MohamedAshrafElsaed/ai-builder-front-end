"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plan, getActionIcon } from "@/types/chat";

interface PlanApprovalProps {
    plan: Plan;
    onApprove: () => void;
    onReject: () => void;
}

export function PlanApproval({ plan, onApprove, onReject }: PlanApprovalProps) {
    const [expanded, setExpanded] = useState(false);

    const createCount = plan.steps.filter((s) => s.action === "create").length;
    const modifyCount = plan.steps.filter((s) => s.action === "modify").length;
    const deleteCount = plan.steps.filter((s) => s.action === "delete").length;

    return (
        <div className="flex-shrink-0 border-t border-status-warning/30 bg-status-warning/5">
            <div className="max-w-3xl mx-auto p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-status-warning/10 border border-status-warning/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangleIcon className="h-5 w-5 text-status-warning" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary">
                                Plan Ready for Review
                            </h3>
                            <p className="text-xs text-text-secondary mt-0.5">
                                {plan.summary}
                            </p>
                        </div>
                    </div>

                    {/* Action Counts */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {createCount > 0 && (
                            <Badge variant="success" className="text-xs">
                                +{createCount} new
                            </Badge>
                        )}
                        {modifyCount > 0 && (
                            <Badge variant="info" className="text-xs">
                                ~{modifyCount} modified
                            </Badge>
                        )}
                        {deleteCount > 0 && (
                            <Badge variant="error" className="text-xs">
                                -{deleteCount} deleted
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Steps List (Collapsible) */}
                <div className="rounded-lg border border-border-subtle overflow-hidden">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-elevated hover:bg-bg-hover transition-colors"
                    >
                        <span className="text-sm font-medium text-text-primary">
                            {plan.steps.length} step{plan.steps.length !== 1 ? "s" : ""} to execute
                        </span>
                        <ChevronDownIcon
                            className={`h-4 w-4 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                    </button>

                    {expanded && (
                        <div className="divide-y divide-border-subtle bg-bg-base">
                            {plan.steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 px-4 py-3"
                                >
                                    <span className="text-sm mt-0.5">{getActionIcon(step.action)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-mono text-text-primary truncate">
                                            {step.file}
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {step.description}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            step.action === "create"
                                                ? "success"
                                                : step.action === "delete"
                                                    ? "error"
                                                    : "default"
                                        }
                                        className="text-[10px] flex-shrink-0"
                                    >
                                        {step.action}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-text-muted">
                        Review the plan before executing changes
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onReject}>
                            <XIcon className="h-4 w-4 mr-1.5" />
                            Reject
                        </Button>
                        <Button size="sm" onClick={onApprove}>
                            <CheckIcon className="h-4 w-4 mr-1.5" />
                            Approve & Execute
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Icons
// ============================================================================

function AlertTriangleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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