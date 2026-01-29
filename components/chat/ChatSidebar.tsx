"use client";

import { useState, useMemo, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/Modal";
import { Conversation, formatRelativeTime } from "@/types/chat";
import { Project } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface ChatSidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNewChat: () => void;
    onDelete: (id: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    isMobile?: boolean;
    onClose?: () => void;
    // Project selection
    projects?: Project[];
    currentProjectId?: string;
    onProjectChange?: (id: string) => void;
    // Interactive mode
    interactiveMode?: boolean;
    onInteractiveModeChange?: (enabled: boolean) => void;
}

interface ConversationGroup {
    label: string;
    conversations: Conversation[];
}

// ============================================================================
// Main Component
// ============================================================================

export function ChatSidebar({
                                conversations,
                                selectedId,
                                onSelect,
                                onNewChat,
                                onDelete,
                                isOpen,
                                onToggle,
                                isMobile = false,
                                onClose,
                                projects = [],
                                currentProjectId,
                                onProjectChange,
                                interactiveMode = false,
                                onInteractiveModeChange,
                            }: ChatSidebarProps) {
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Group conversations by date
    const groupedConversations = useMemo(() => {
        if (!conversations || !Array.isArray(conversations)) return [];

        const filtered = conversations.filter((conv) => {
            if (!search.trim()) return true;
            const searchLower = search.toLowerCase();
            return (
                (conv.title?.toLowerCase().includes(searchLower)) ||
                (conv.last_message?.toLowerCase().includes(searchLower))
            );
        });

        const groups: ConversationGroup[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);

        const thisMonthStart = new Date(today);
        thisMonthStart.setDate(thisMonthStart.getDate() - 30);

        const todayConvs: Conversation[] = [];
        const yesterdayConvs: Conversation[] = [];
        const thisWeekConvs: Conversation[] = [];
        const thisMonthConvs: Conversation[] = [];
        const olderConvs: Conversation[] = [];

        filtered.forEach((conv) => {
            const convDate = new Date(conv.updated_at);
            convDate.setHours(0, 0, 0, 0);

            if (convDate >= today) {
                todayConvs.push(conv);
            } else if (convDate >= yesterday) {
                yesterdayConvs.push(conv);
            } else if (convDate >= thisWeekStart) {
                thisWeekConvs.push(conv);
            } else if (convDate >= thisMonthStart) {
                thisMonthConvs.push(conv);
            } else {
                olderConvs.push(conv);
            }
        });

        if (todayConvs.length > 0) groups.push({ label: "Today", conversations: todayConvs });
        if (yesterdayConvs.length > 0) groups.push({ label: "Yesterday", conversations: yesterdayConvs });
        if (thisWeekConvs.length > 0) groups.push({ label: "This Week", conversations: thisWeekConvs });
        if (thisMonthConvs.length > 0) groups.push({ label: "This Month", conversations: thisMonthConvs });
        if (olderConvs.length > 0) groups.push({ label: "Older", conversations: olderConvs });

        return groups;
    }, [conversations, search]);

    // Flat list for keyboard navigation
    const flatConversations = useMemo(() => {
        return groupedConversations.flatMap((g) => g.conversations);
    }, [groupedConversations]);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex((prev) => Math.min(prev + 1, flatConversations.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && focusedIndex >= 0) {
            e.preventDefault();
            const conv = flatConversations[focusedIndex];
            if (conv) {
                onSelect(conv.id);
                onClose?.();
            }
        } else if (e.key === "Escape") {
            setSearch("");
            searchInputRef.current?.blur();
        }
    };

    // Focus search on Cmd+F
    useEffect(() => {
        const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "f" && isOpen) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [isOpen]);

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    // Handle selection with mobile close
    const handleSelect = (id: string) => {
        onSelect(id);
        if (isMobile) onClose?.();
    };

    // Collapsed state (desktop only)
    if (!isOpen && !isMobile) {
        return (
            <div className="w-16 flex flex-col items-center py-4 border-r border-border-subtle bg-bg-surface">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="mb-4"
                    aria-label="Expand sidebar"
                >
                    <PanelLeftIcon className="h-5 w-5" />
                </Button>
                <Button
                    variant="primary"
                    size="icon"
                    onClick={onNewChat}
                    className="mb-4"
                    aria-label="New chat"
                >
                    <PlusIcon className="h-5 w-5" />
                </Button>
                <div className="flex-1" />
                {onInteractiveModeChange && (
                    <button
                        onClick={() => onInteractiveModeChange(!interactiveMode)}
                        className={`p-2 rounded-lg transition-colors ${
                            interactiveMode
                                ? "bg-accent-primary/10 text-accent-primary"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                        }`}
                        aria-label="Interactive mode"
                    >
                        <ZapIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
        );
    }

    // Mobile overlay
    if (isMobile) {
        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Drawer */}
                <aside
                    className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-bg-surface shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Conversations"
                    onKeyDown={handleKeyDown}
                >
                    <SidebarContent
                        search={search}
                        setSearch={setSearch}
                        searchInputRef={searchInputRef}
                        groupedConversations={groupedConversations}
                        flatConversations={flatConversations}
                        selectedId={selectedId}
                        focusedIndex={focusedIndex}
                        setFocusedIndex={setFocusedIndex}
                        onSelect={handleSelect}
                        onNewChat={() => { onNewChat(); onClose?.(); }}
                        onDeleteRequest={setDeleteTarget}
                        onClose={onClose}
                        projects={projects}
                        currentProjectId={currentProjectId}
                        onProjectChange={onProjectChange}
                        interactiveMode={interactiveMode}
                        onInteractiveModeChange={onInteractiveModeChange}
                        isMobile
                    />
                </aside>

                {/* Delete Modal */}
                <ConfirmModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Conversation"
                    message={`Are you sure you want to delete "${deleteTarget?.title || "this conversation"}"? This action cannot be undone.`}
                    confirmText="Delete"
                    variant="danger"
                />
            </>
        );
    }

    // Desktop expanded
    return (
        <aside
            className="w-72 flex flex-col border-r border-border-subtle bg-bg-surface transition-all duration-300"
            onKeyDown={handleKeyDown}
            role="complementary"
            aria-label="Conversations sidebar"
        >
            <SidebarContent
                search={search}
                setSearch={setSearch}
                searchInputRef={searchInputRef}
                groupedConversations={groupedConversations}
                flatConversations={flatConversations}
                selectedId={selectedId}
                focusedIndex={focusedIndex}
                setFocusedIndex={setFocusedIndex}
                onSelect={handleSelect}
                onNewChat={onNewChat}
                onDeleteRequest={setDeleteTarget}
                onToggle={onToggle}
                projects={projects}
                currentProjectId={currentProjectId}
                onProjectChange={onProjectChange}
                interactiveMode={interactiveMode}
                onInteractiveModeChange={onInteractiveModeChange}
            />

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Conversation"
                message={`Are you sure you want to delete "${deleteTarget?.title || "this conversation"}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </aside>
    );
}

// ============================================================================
// Sidebar Content
// ============================================================================

interface SidebarContentProps {
    search: string;
    setSearch: (value: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    groupedConversations: ConversationGroup[];
    flatConversations: Conversation[];
    selectedId: string | null;
    focusedIndex: number;
    setFocusedIndex: (index: number) => void;
    onSelect: (id: string) => void;
    onNewChat: () => void;
    onDeleteRequest: (conv: Conversation) => void;
    onToggle?: () => void;
    onClose?: () => void;
    projects?: Project[];
    currentProjectId?: string;
    onProjectChange?: (id: string) => void;
    interactiveMode?: boolean;
    onInteractiveModeChange?: (enabled: boolean) => void;
    isMobile?: boolean;
}

function SidebarContent({
                            search,
                            setSearch,
                            searchInputRef,
                            groupedConversations,
                            flatConversations,
                            selectedId,
                            focusedIndex,
                            setFocusedIndex,
                            onSelect,
                            onNewChat,
                            onDeleteRequest,
                            onToggle,
                            onClose,
                            projects = [],
                            currentProjectId,
                            onProjectChange,
                            interactiveMode,
                            onInteractiveModeChange,
                            isMobile,
                        }: SidebarContentProps) {
    return (
        <>
            {/* Header */}
            <div className="flex-shrink-0 p-3 border-b border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-text-primary">Conversations</h2>
                    <div className="flex items-center gap-1">
                        {isMobile && onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                                <XIcon className="h-5 w-5" />
                            </Button>
                        )}
                        {!isMobile && onToggle && (
                            <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Collapse sidebar">
                                <PanelLeftCloseIcon className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Project Selector */}
                {projects.length > 0 && onProjectChange && (
                    <select
                        value={currentProjectId || ""}
                        onChange={(e) => onProjectChange(e.target.value)}
                        className="w-full px-3 py-2 mb-3 text-sm bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-all"
                        aria-label="Select project"
                    >
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* New Chat Button */}
                <Button
                    variant="primary"
                    className="w-full justify-center gap-2"
                    onClick={onNewChat}
                >
                    <PlusIcon className="h-4 w-4" />
                    New Chat
                    <kbd className="hidden sm:inline-flex ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-white/20 rounded">
                        ⌘N
                    </kbd>
                </Button>
            </div>

            {/* Search */}
            <div className="flex-shrink-0 p-3 border-b border-border-subtle">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search conversations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-8 h-9 text-sm"
                        aria-label="Search conversations"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
                            aria-label="Clear search"
                        >
                            <XIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin" role="listbox" aria-label="Conversations">
                {groupedConversations.length === 0 ? (
                    <EmptyState hasSearch={!!search.trim()} onNewChat={onNewChat} />
                ) : (
                    groupedConversations.map((group) => (
                        <DateGroup
                            key={group.label}
                            label={group.label}
                            conversations={group.conversations}
                            selectedId={selectedId}
                            focusedIndex={focusedIndex}
                            flatConversations={flatConversations}
                            setFocusedIndex={setFocusedIndex}
                            onSelect={onSelect}
                            onDeleteRequest={onDeleteRequest}
                        />
                    ))
                )}
            </div>

            {/* Footer Settings */}
            {onInteractiveModeChange && (
                <div className="flex-shrink-0 p-3 border-t border-border-subtle">
                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated cursor-pointer transition-colors group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={interactiveMode}
                                onChange={(e) => onInteractiveModeChange(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-bg-elevated rounded-full peer-checked:bg-accent-primary transition-colors" />
                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm text-text-primary group-hover:text-text-primary">Interactive Mode</span>
                            <p className="text-xs text-text-muted">Review plans before execution</p>
                        </div>
                        <ZapIcon className={`h-4 w-4 transition-colors ${interactiveMode ? "text-accent-primary" : "text-text-muted"}`} />
                    </label>
                </div>
            )}
        </>
    );
}

// ============================================================================
// Date Group
// ============================================================================

interface DateGroupProps {
    label: string;
    conversations: Conversation[];
    selectedId: string | null;
    focusedIndex: number;
    flatConversations: Conversation[];
    setFocusedIndex: (index: number) => void;
    onSelect: (id: string) => void;
    onDeleteRequest: (conv: Conversation) => void;
}

function DateGroup({
                       label,
                       conversations,
                       selectedId,
                       focusedIndex,
                       flatConversations,
                       setFocusedIndex,
                       onSelect,
                       onDeleteRequest,
                   }: DateGroupProps) {
    return (
        <div className="py-2">
            <h3 className="px-4 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wider">
                {label}
            </h3>
            <div className="px-2 space-y-0.5">
                {conversations.map((conv) => {
                    const globalIndex = flatConversations.findIndex((c) => c.id === conv.id);
                    return (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isSelected={selectedId === conv.id}
                            isFocused={focusedIndex === globalIndex}
                            onSelect={() => onSelect(conv.id)}
                            onDelete={() => onDeleteRequest(conv)}
                            onFocus={() => setFocusedIndex(globalIndex)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Conversation Item
// ============================================================================

interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    isFocused: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onFocus: () => void;
}

function ConversationItem({
                              conversation,
                              isSelected,
                              isFocused,
                              onSelect,
                              onDelete,
                              onFocus,
                          }: ConversationItemProps) {
    return (
        <div
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            onClick={onSelect}
            onFocus={onFocus}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect();
                }
                if (e.key === "Delete" || e.key === "Backspace") {
                    e.preventDefault();
                    onDelete();
                }
            }}
            className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 outline-none ${
                isSelected
                    ? "bg-accent-primary/10 border-l-2 border-accent-primary ml-0 pl-[10px]"
                    : isFocused
                        ? "bg-bg-elevated border-l-2 border-transparent"
                        : "border-l-2 border-transparent hover:bg-bg-elevated"
            }`}
        >
            {/* Icon */}
            <ChatBubbleIcon
                className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-colors ${
                    isSelected ? "text-accent-primary" : "text-text-muted"
                }`}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p
                        className={`text-sm font-medium truncate transition-colors ${
                            isSelected ? "text-accent-primary" : "text-text-primary"
                        }`}
                    >
                        {conversation.title || "Untitled"}
                    </p>
                    <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">
                        {formatRelativeTime(conversation.updated_at)}
                    </span>
                </div>
                <p className="text-xs text-text-muted truncate mt-0.5 pr-6">
                    {conversation.last_message || "No messages"}
                </p>
                {conversation.message_count > 0 && (
                    <p className="text-[10px] text-text-muted mt-1">
                        {conversation.message_count} message{conversation.message_count !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-status-error/10 text-text-muted hover:text-status-error transition-all"
                aria-label={`Delete ${conversation.title || "conversation"}`}
            >
                <TrashIcon className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// Re-export ConversationItem for external use
export { ConversationItem };

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ hasSearch, onNewChat }: { hasSearch: boolean; onNewChat: () => void }) {
    if (hasSearch) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <SearchIcon className="h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-secondary mb-1">No conversations found</p>
                <p className="text-xs text-text-muted">Try a different search term</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center mb-3">
                <ChatBubbleIcon className="h-6 w-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary mb-1">No conversations yet</p>
            <p className="text-xs text-text-muted mb-4">Start a new chat to begin</p>
            <Button variant="secondary" size="sm" onClick={onNewChat}>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Start Chat
            </Button>
        </div>
    );
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function ChatBubbleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

function PanelLeftCloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <path d="M15 9l-3 3 3 3" />
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