"use client";

import { useState, useMemo, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/Modal";
import { Conversation, formatRelativeTime } from "@/types/chat";

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
                            }: ChatSidebarProps) {
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut for new chat (Cmd/Ctrl + Shift + O)
    useEffect(() => {
        const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "o") {
                e.preventDefault();
                onNewChat();
            }
            // Focus search with Cmd/Ctrl + K when sidebar is open
            if ((e.metaKey || e.ctrlKey) && e.key === "k" && isOpen) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [onNewChat, isOpen]);

    // Group conversations by date
    const groupedConversations = useMemo(() => {
        if (!conversations?.length) return [];

        const filtered = conversations.filter((conv) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return conv.title?.toLowerCase().includes(q) || conv.last_message?.toLowerCase().includes(q);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const buckets = { today: [] as Conversation[], yesterday: [] as Conversation[], week: [] as Conversation[], older: [] as Conversation[] };

        filtered.forEach((conv) => {
            const d = new Date(conv.updated_at);
            d.setHours(0, 0, 0, 0);
            if (d >= today) buckets.today.push(conv);
            else if (d >= yesterday) buckets.yesterday.push(conv);
            else if (d >= weekAgo) buckets.week.push(conv);
            else buckets.older.push(conv);
        });

        const groups: ConversationGroup[] = [];
        if (buckets.today.length) groups.push({ label: "Today", conversations: buckets.today });
        if (buckets.yesterday.length) groups.push({ label: "Yesterday", conversations: buckets.yesterday });
        if (buckets.week.length) groups.push({ label: "This Week", conversations: buckets.week });
        if (buckets.older.length) groups.push({ label: "Older", conversations: buckets.older });
        return groups;
    }, [conversations, search]);

    const flatConversations = useMemo(() => groupedConversations.flatMap((g) => g.conversations), [groupedConversations]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const len = flatConversations.length;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex((i) => Math.min(i + 1, len - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && focusedIndex >= 0) {
            e.preventDefault();
            const conv = flatConversations[focusedIndex];
            if (conv) onSelect(conv.id);
        } else if (e.key === "Escape") {
            setSearch("");
            searchInputRef.current?.blur();
        }
    }, [flatConversations, focusedIndex, onSelect]);

    const handleSelect = useCallback((id: string) => {
        onSelect(id);
        if (isMobile) onToggle();
    }, [onSelect, isMobile, onToggle]);

    const handleDeleteConfirm = useCallback(() => {
        if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
        }
    }, [deleteTarget, onDelete]);

    // Desktop collapsed state
    if (!isOpen && !isMobile) {
        return (
            <aside className="w-14 flex flex-col items-center py-3 gap-2 border-r border-border-subtle bg-bg-surface">
                <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Expand sidebar" className="text-text-muted hover:text-text-primary">
                    <ChevronRightIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onNewChat} aria-label="New chat" className="text-text-muted hover:text-accent-primary">
                    <PlusIcon className="h-5 w-5" />
                </Button>
                <div className="flex-1" />
                {flatConversations.slice(0, 5).map((conv) => (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                            selectedId === conv.id ? "bg-accent-primary/10 text-accent-primary" : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                        }`}
                        title={conv.title || "Untitled"}
                    >
                        <ChatBubbleIcon className="h-4 w-4" />
                    </button>
                ))}
            </aside>
        );
    }

    // Mobile overlay
    if (isMobile && isOpen) {
        return (
            <>
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onToggle} />
                <aside
                    className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-bg-surface shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
                    role="dialog"
                    aria-modal="true"
                    onKeyDown={handleKeyDown}
                >
                    <SidebarHeader onNewChat={onNewChat} onClose={onToggle} isMobile />
                    <SearchBar value={search} onChange={setSearch} inputRef={searchInputRef} />
                    <ConversationList
                        groups={groupedConversations}
                        flat={flatConversations}
                        selectedId={selectedId}
                        focusedIndex={focusedIndex}
                        setFocusedIndex={setFocusedIndex}
                        onSelect={handleSelect}
                        onDeleteRequest={setDeleteTarget}
                        search={search}
                        onNewChat={onNewChat}
                        listRef={listRef}
                    />
                </aside>
                <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />
            </>
        );
    }

    // Desktop expanded
    return (
        <aside className="w-[280px] flex flex-col border-r border-border-subtle bg-bg-surface transition-all duration-300" onKeyDown={handleKeyDown}>
            <SidebarHeader onNewChat={onNewChat} onCollapse={onToggle} />
            <SearchBar value={search} onChange={setSearch} inputRef={searchInputRef} />
            <ConversationList
                groups={groupedConversations}
                flat={flatConversations}
                selectedId={selectedId}
                focusedIndex={focusedIndex}
                setFocusedIndex={setFocusedIndex}
                onSelect={handleSelect}
                onDeleteRequest={setDeleteTarget}
                search={search}
                onNewChat={onNewChat}
                listRef={listRef}
            />
            <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />
        </aside>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function SidebarHeader({ onNewChat, onCollapse, onClose, isMobile }: { onNewChat: () => void; onCollapse?: () => void; onClose?: () => void; isMobile?: boolean }) {
    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
    const shortcut = isMac ? "⌘⇧O" : "Ctrl+Shift+O";

    return (
        <div className="flex-shrink-0 p-3 border-b border-border-subtle">
            <div className="flex items-center gap-2 mb-3">
                {isMobile ? (
                    <button onClick={onClose} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors" aria-label="Close sidebar">
                        <XIcon className="h-5 w-5" />
                    </button>
                ) : (
                    <button onClick={onCollapse} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors" aria-label="Collapse sidebar">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                )}
                <h2 className="text-sm font-semibold text-text-primary flex-1">Conversations</h2>
            </div>
            <Button variant="primary" className="w-full justify-center gap-2" onClick={onNewChat}>
                <PlusIcon className="h-4 w-4" />
                <span>New Chat</span>
                <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded text-text-muted">{shortcut}</kbd>
            </Button>
        </div>
    );
}

function SearchBar({ value, onChange, inputRef }: { value: string; onChange: (v: string) => void; inputRef: React.RefObject<HTMLInputElement | null> }) {
    return (
        <div className="flex-shrink-0 px-3 py-2">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search conversations..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-9 pr-8 h-9 text-sm bg-bg-elevated border-transparent focus:border-accent-primary/50"
                />
                {value && (
                    <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary" aria-label="Clear search">
                        <XIcon className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

function ConversationList({
                              groups, flat, selectedId, focusedIndex, setFocusedIndex, onSelect, onDeleteRequest, search, onNewChat, listRef,
                          }: {
    groups: ConversationGroup[];
    flat: Conversation[];
    selectedId: string | null;
    focusedIndex: number;
    setFocusedIndex: (i: number) => void;
    onSelect: (id: string) => void;
    onDeleteRequest: (c: Conversation) => void;
    search: string;
    onNewChat: () => void;
    listRef: React.RefObject<HTMLDivElement | null>;
}) {
    if (!flat.length) return <EmptyState hasSearch={!!search.trim()} onNewChat={onNewChat} />;

    return (
        <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin" role="listbox" aria-label="Conversations">
            {groups.map((group) => (
                <DateGroup
                    key={group.label}
                    label={group.label}
                    conversations={group.conversations}
                    selectedId={selectedId}
                    focusedIndex={focusedIndex}
                    flat={flat}
                    setFocusedIndex={setFocusedIndex}
                    onSelect={onSelect}
                    onDeleteRequest={onDeleteRequest}
                />
            ))}
        </div>
    );
}

function DateGroup({ label, conversations, selectedId, focusedIndex, flat, setFocusedIndex, onSelect, onDeleteRequest }: {
    label: string;
    conversations: Conversation[];
    selectedId: string | null;
    focusedIndex: number;
    flat: Conversation[];
    setFocusedIndex: (i: number) => void;
    onSelect: (id: string) => void;
    onDeleteRequest: (c: Conversation) => void;
}) {
    return (
        <div className="py-2">
            <h3 className="px-4 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</h3>
            <div className="px-2 space-y-0.5">
                {conversations.map((conv) => {
                    const idx = flat.findIndex((c) => c.id === conv.id);
                    return (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isSelected={selectedId === conv.id}
                            isFocused={focusedIndex === idx}
                            onSelect={() => onSelect(conv.id)}
                            onDelete={() => onDeleteRequest(conv)}
                            onFocus={() => setFocusedIndex(idx)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function ConversationItem({ conversation, isSelected, isFocused, onSelect, onDelete, onFocus }: {
    conversation: Conversation;
    isSelected: boolean;
    isFocused: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onFocus: () => void;
}) {
    return (
        <div
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            onClick={onSelect}
            onFocus={onFocus}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
                if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onDelete(); }
            }}
            className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 outline-none ${
                isSelected
                    ? "bg-accent-primary/10 border-l-2 border-accent-primary pl-[10px]"
                    : isFocused
                        ? "bg-bg-elevated border-l-2 border-transparent"
                        : "border-l-2 border-transparent hover:bg-bg-elevated"
            }`}
        >
            <ChatBubbleIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-colors ${isSelected ? "text-accent-primary" : "text-text-muted"}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-accent-primary" : "text-text-primary"}`}>
                        {conversation.title || "Untitled"}
                    </p>
                    <span className="text-[10px] text-text-muted whitespace-nowrap">{formatRelativeTime(conversation.updated_at)}</span>
                </div>
                <p className="text-xs text-text-muted truncate mt-0.5 pr-6">{conversation.last_message || "No messages"}</p>
                {conversation.message_count > 0 && (
                    <p className="text-[10px] text-text-muted mt-1">{conversation.message_count} message{conversation.message_count !== 1 ? "s" : ""}</p>
                )}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-status-error/10 text-text-muted hover:text-status-error transition-all"
                aria-label={`Delete ${conversation.title || "conversation"}`}
            >
                <TrashIcon className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

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

function DeleteModal({ target, onClose, onConfirm }: { target: Conversation | null; onClose: () => void; onConfirm: () => void }) {
    return (
        <ConfirmModal
            isOpen={!!target}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Delete Conversation"
            message={`Are you sure you want to delete "${target?.title || "this conversation"}"? This action cannot be undone.`}
            confirmLabel="Delete"
            isDestructive
        />
    );
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}

function SearchIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}

function XIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}

function TrashIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}

function ChatBubbleIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}

function ChevronLeftIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
}

function ChevronRightIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
}

export { ConversationItem };