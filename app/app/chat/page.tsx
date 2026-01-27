"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useMediaQuery } from "@/hooks/use-media-query";

// Mock Data
const CONVERSATIONS = [
    { id: 1, title: "Refactor User Controller", date: "Today", preview: "I've analyzed the controller..." },
    { id: 2, title: "Add Stripe Payment", date: "Yesterday", preview: "Here's the plan for Stripe..." },
    { id: 3, title: "Fix PHPUnit Tests", date: "2 days ago", preview: "The test failure is due to..." },
];

export default function ChatPage() {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [selectedChat, setSelectedChat] = useState<number | null>(null);

    // Reset selection when switching to desktop to show default empty state or first chat
    useEffect(() => {
        if (isDesktop && selectedChat === null && CONVERSATIONS.length > 0) {
            setSelectedChat(CONVERSATIONS[0].id);
        }
    }, [isDesktop, selectedChat]);

    // Mobile View Logic
    if (!isDesktop) {
        if (selectedChat !== null) {
            return (
                <ChatInterface
                    onBack={() => setSelectedChat(null)}
                    title={CONVERSATIONS.find(c => c.id === selectedChat)?.title || "Chat"}
                />
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">Chat</h1>
                    <Button size="sm">New Chat</Button>
                </div>
                <ConversationList
                    selectedId={selectedChat}
                    onSelect={setSelectedChat}
                />
            </div>
        );
    }

    // Desktop View (Split Pane)
    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            <Card noPadding className="w-80 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border-subtle flex justify-between items-center">
                    <h2 className="font-semibold text-text-primary">History</h2>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <PlusIcon className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ConversationList
                        selectedId={selectedChat}
                        onSelect={setSelectedChat}
                    />
                </div>
            </Card>

            <Card noPadding className="flex-1 flex flex-col overflow-hidden">
                {selectedChat ? (
                    <ChatInterface title={CONVERSATIONS.find(c => c.id === selectedChat)?.title} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-muted">
                        Select a conversation to start chatting
                    </div>
                )}
            </Card>
        </div>
    );
}

function ConversationList({ selectedId, onSelect }: { selectedId: number | null; onSelect: (id: number) => void }) {
    return (
        <div className="divide-y divide-border-subtle">
            {CONVERSATIONS.map((chat) => (
                <button
                    key={chat.id}
                    onClick={() => onSelect(chat.id)}
                    className={`w-full text-left p-4 hover:bg-bg-elevated transition-colors ${selectedId === chat.id ? "bg-bg-elevated border-l-2 border-accent-primary" : "border-l-2 border-transparent"
                        }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-medium text-sm truncate pr-2 ${selectedId === chat.id ? "text-accent-primary" : "text-text-primary"}`}>
                            {chat.title}
                        </h3>
                        <span className="text-xs text-text-muted whitespace-nowrap">{chat.date}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{chat.preview}</p>
                </button>
            ))}
        </div>
    );
}

function ChatInterface({ onBack, title }: { onBack?: () => void; title?: string }) {
    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="h-14 border-b border-border-subtle flex items-center px-4 gap-3 bg-bg-elevated/50">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </Button>
                )}
                <span className="font-semibold text-text-primary truncate">{title}</span>
            </div>

            {/* Chat Messages Placeholder */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <ChatMessage role="user" content="How do I add a new service class?" />
                <ChatMessage role="ai" content="I can help with that. First, let's look at your directory structure. You should place it in the `app/Services` directory." />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border-subtle bg-bg-base">
                <div className="flex gap-2">
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button>Send</Button>
                </div>
            </div>
        </div>
    );
}

function ChatMessage({ role, content }: { role: "user" | "ai"; content: string }) {
    const isAi = role === "ai";
    return (
        <div className={`flex gap-3 ${isAi ? "" : "flex-row-reverse"}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isAi ? "bg-accent-primary text-white" : "bg-bg-elevated text-text-primary"
                }`}>
                {isAi ? "AI" : "U"}
            </div>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${isAi ? "bg-bg-elevated text-text-primary" : "bg-accent-primary/10 text-text-primary border border-accent-primary/20"
                }`}>
                {content}
            </div>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function ChevronLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}
