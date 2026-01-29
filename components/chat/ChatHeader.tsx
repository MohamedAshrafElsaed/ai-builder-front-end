"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useChat } from "@/hooks/useChat";
import { ChatStatus, getStatusLabel, getAgentColor, getAgentEmoji } from "@/types/chat";

interface ChatHeaderProps {
    chat: ReturnType<typeof useChat>;
    projectName: string;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    codePanelOpen: boolean;
    onToggleCodePanel: () => void;
}

export function ChatHeader({
                               chat,
                               projectName,
                               sidebarOpen,
                               onToggleSidebar,
                               codePanelOpen,
                               onToggleCodePanel,
                           }: ChatHeaderProps) {
    const conversationTitle = chat.conversationId
        ? chat.conversations.find((c) => c.id === chat.conversationId)?.title || "Chat"
        : "New Chat";

    return (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                {/* Sidebar Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                    {sidebarOpen ? (
                        <PanelLeftCloseIcon className="h-4 w-4" />
                    ) : (
                        <PanelLeftIcon className="h-4 w-4" />
                    )}
                </Button>

                {/* Agent Info or Title */}
                {chat.activeAgent ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg border"
                            style={{
                                backgroundColor: `${getAgentColor(chat.activeAgent.agent_type)}15`,
                                borderColor: `${getAgentColor(chat.activeAgent.agent_type)}30`,
                            }}
                        >
                            {getAgentEmoji(chat.activeAgent.agent_type)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                {chat.activeAgent.name}
                            </p>
                            <p className="text-xs text-text-muted">{chat.activeAgent.role}</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-medium text-text-primary">{conversationTitle}</p>
                        <p className="text-xs text-text-muted">{projectName}</p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Status Badge */}
                <StatusBadge status={chat.status} />

                {/* Code Panel Toggle */}
                {chat.hasCodeChanges && (
                    <Button
                        variant={codePanelOpen ? "secondary" : "ghost"}
                        size="sm"
                        onClick={onToggleCodePanel}
                        className="gap-1.5"
                    >
                        <CodeIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Code</span>
                        <Badge variant="accent" className="ml-0.5 text-[10px] px-1.5">
                            {chat.executionResults.length}
                        </Badge>
                    </Button>
                )}

                {/* Cancel Button */}
                {chat.isProcessing && (
                    <Button variant="ghost" size="sm" onClick={chat.cancelRequest}>
                        <StopIcon className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1.5">Cancel</span>
                    </Button>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: ChatStatus }) {
    const variants: Record<ChatStatus, "default" | "success" | "warning" | "error" | "info" | "accent"> = {
        idle: "default",
        connecting: "info",
        analyzing: "info",
        planning: "info",
        executing: "warning",
        validating: "warning",
        streaming: "accent",
        awaiting_approval: "warning",
        complete: "success",
        error: "error",
    };

    const isAnimated = [
        "connecting",
        "analyzing",
        "planning",
        "executing",
        "validating",
        "streaming",
    ].includes(status);

    if (status === "idle") return null;

    return (
        <Badge variant={variants[status]} className={isAnimated ? "animate-pulse" : ""}>
            {isAnimated && (
                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
            )}
            {getStatusLabel(status)}
        </Badge>
    );
}

// ============================================================================
// Icons
// ============================================================================

function PanelLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
    );
}

function PanelLeftCloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <path d="M15 9l-3 3 3 3" />
        </svg>
    );
}

function CodeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    );
}

function StopIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
    );
}