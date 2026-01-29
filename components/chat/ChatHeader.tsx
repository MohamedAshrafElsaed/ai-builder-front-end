"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChatStatus, AgentInfo, getStatusLabel, getAgentColor, getAgentEmoji } from "@/types/chat";

// ============================================================================
// Types
// ============================================================================

interface ChatHeaderProps {
    projectName: string;
    conversationTitle?: string;
    status: ChatStatus;
    activeAgent?: AgentInfo | null;
    hasCodeChanges?: boolean;
    codeChangesCount?: number;
    onNewChat: () => void;
    onToggleSidebar: () => void;
    onToggleCodePanel: () => void;
    showCodePanel: boolean;
    onCancel?: () => void;
    isMobile?: boolean;
    onBack?: () => void;
    onOpenMobileMenu?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ChatHeader({
                               projectName,
                               conversationTitle,
                               status,
                               activeAgent,
                               hasCodeChanges = false,
                               codeChangesCount = 0,
                               onNewChat,
                               onToggleSidebar,
                               onToggleCodePanel,
                               showCodePanel,
                               onCancel,
                               isMobile = false,
                               onBack,
                               onOpenMobileMenu,
                           }: ChatHeaderProps) {
    const isProcessing = ["connecting", "analyzing", "planning", "executing", "validating", "streaming"].includes(status);

    return (
        <header className="flex-shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-sm">
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile: Back button or Menu */}
                {isMobile ? (
                    onBack ? (
                        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back" className="shrink-0">
                            <ChevronLeftIcon className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={onOpenMobileMenu} aria-label="Open menu" className="shrink-0">
                            <MenuIcon className="h-5 w-5" />
                        </Button>
                    )
                ) : (
                    /* Desktop: Sidebar toggle */
                    <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar" className="shrink-0">
                        <PanelLeftIcon className="h-4 w-4" />
                    </Button>
                )}

                {/* Agent or Title Info */}
                {activeAgent && isProcessing ? (
                    <AgentBadge agent={activeAgent} />
                ) : (
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-semibold text-text-primary truncate">
                                {conversationTitle || "New Chat"}
                            </h1>
                            <StatusBadge status={status} />
                        </div>
                        <p className="text-xs text-text-muted truncate hidden sm:block">{projectName}</p>
                    </div>
                )}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* New Chat */}
                <Button variant="ghost" size="sm" onClick={onNewChat} className="gap-1.5" aria-label="Start new chat">
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">New</span>
                </Button>

                {/* Code Panel Toggle */}
                {hasCodeChanges && (
                    <Button
                        variant={showCodePanel ? "secondary" : "ghost"}
                        size="sm"
                        onClick={onToggleCodePanel}
                        className="gap-1.5"
                        aria-label={showCodePanel ? "Close code panel" : "Open code panel"}
                    >
                        <CodeIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Code</span>
                        {codeChangesCount > 0 && (
                            <Badge variant="accent" className="ml-0.5 text-[10px] px-1.5 py-0">
                                {codeChangesCount}
                            </Badge>
                        )}
                    </Button>
                )}

                {/* Cancel Button (when processing) */}
                {isProcessing && onCancel && (
                    <Button variant="ghost" size="sm" onClick={onCancel} className="text-status-error hover:text-status-error gap-1.5">
                        <StopIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Stop</span>
                    </Button>
                )}

                {/* Settings (Desktop only) */}
                {!isMobile && (
                    <Button variant="ghost" size="icon" aria-label="Settings" className="hidden lg:flex">
                        <SettingsIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </header>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function AgentBadge({ agent }: { agent: AgentInfo }) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border shrink-0 animate-pulse"
                style={{
                    backgroundColor: `${getAgentColor(agent.agent_type)}15`,
                    borderColor: `${getAgentColor(agent.agent_type)}30`,
                }}
            >
                {getAgentEmoji(agent.agent_type)}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{agent.name}</p>
                <p className="text-xs text-text-muted truncate">{agent.role}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: ChatStatus }) {
    const config: Record<string, { variant: "default" | "success" | "warning" | "error" | "info" | "accent"; label: string; animated: boolean }> = {
        idle: { variant: "default", label: "", animated: false },
        connecting: { variant: "info", label: "Connecting", animated: true },
        analyzing: { variant: "info", label: "Analyzing", animated: true },
        planning: { variant: "info", label: "Planning", animated: true },
        executing: { variant: "warning", label: "Executing", animated: true },
        validating: { variant: "warning", label: "Validating", animated: true },
        streaming: { variant: "accent", label: "Responding", animated: true },
        awaiting_approval: { variant: "warning", label: "Awaiting Approval", animated: false },
        complete: { variant: "success", label: "Complete", animated: false },
        error: { variant: "error", label: "Error", animated: false },
    };

    const statusConfig = config[status] || { variant: "default" as const, label: "", animated: false };
    const { variant, label, animated } = statusConfig;
    if (!label) return null;

    return (
        <Badge variant={variant} className={`text-[10px] ${animated ? "animate-pulse" : ""}`}>
            {animated && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />}
            {label}
        </Badge>
    );
}

// ============================================================================
// Icons
// ============================================================================

function ChevronLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function MenuIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function PanelLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    );
}

function CodeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}