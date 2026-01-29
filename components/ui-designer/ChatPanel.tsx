"use client";

import {KeyboardEvent, useEffect, useRef, useState} from 'react';
import {Agent, DesignStatus, Message, TechStack} from '@/types/ui-designer';
import {MessageBubble} from './MessageBubble';
import {ThinkingIndicator} from './ThinkingIndicator';
import {TechStackBadge} from './TechStackBadge';

interface ChatPanelProps {
    agent: Agent | null;
    messages: Message[];
    currentThought: string;
    techStack: TechStack | null;
    status: DesignStatus;
    isGenerating: boolean;
    onSendMessage: (prompt: string) => void;
    onCancel: () => void;
}

const SUGGESTIONS = [
    "Dashboard with stats cards",
    "Settings page with forms",
    "Data table with filters",
    "Sidebar navigation",
];

export function ChatPanel(
    {
        agent,
        messages,
        currentThought,
        techStack,
        status,
        isGenerating,
        onSendMessage,
        onCancel,
    }: ChatPanelProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages, currentThought]);

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = () => {
        const trimmed = input.trim();
        if (!trimmed || isGenerating) return;
        onSendMessage(trimmed);
        setInput('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b]">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 flex items-center justify-center ring-1 ring-white/10">
                            <span className="text-base">{agent?.avatar_emoji || '🎨'}</span>
                        </div>
                        <div
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#09090b] ${
                                status === 'generating' ? 'bg-fuchsia-500 animate-pulse' :
                                    status === 'complete' ? 'bg-emerald-500' :
                                        status === 'error' ? 'bg-red-500' : 'bg-zinc-600'
                            }`}/>
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-zinc-100">{agent?.name || 'Palette'}</h2>
                        <p className="text-[11px] text-zinc-500">{
                            status === 'generating' ? 'Generating...' :
                                status === 'complete' ? 'Ready' : 'Online'
                        }</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="px-4 py-4 space-y-4">
                    {techStack && <TechStackBadge techStack={techStack}/>}

                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} agent={agent}/>
                    ))}

                    {currentThought && status !== 'complete' && (
                        <ThinkingIndicator thought={currentThought} agent={agent}/>
                    )}

                    {status === 'idle' && messages.length <= 2 && (
                        <div className="pt-6">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-3">Quick start</p>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(s);
                                            inputRef.current?.focus();
                                        }}
                                        className="px-3 py-1.5 text-xs text-zinc-500 bg-white/[0.02] border border-white/5 rounded-full hover:bg-white/[0.05] hover:text-zinc-300 hover:border-white/10 transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef}/>
                </div>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t border-white/5">
                <div
                    className="relative flex items-end gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl focus-within:border-fuchsia-500/30 focus-within:bg-white/[0.03] transition-all">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe the UI..."
                        disabled={isGenerating}
                        rows={1}
                        className="flex-1 px-3 py-2 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 resize-none focus:outline-none disabled:opacity-50"
                        style={{minHeight: '40px', maxHeight: '100px'}}
                        onInput={(e) => {
                            const t = e.target as HTMLTextAreaElement;
                            t.style.height = '40px';
                            t.style.height = Math.min(t.scrollHeight, 100) + 'px';
                        }}
                    />
                    {isGenerating ? (
                        <button
                            onClick={onCancel}
                            className="p-2 m-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                 strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!input.trim()}
                            className="p-2 m-1 bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                 strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}