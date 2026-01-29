"use client";

import { Agent } from '@/types/ui-designer';

interface ThinkingIndicatorProps {
    thought: string;
    agent: Agent | null;
}

export function ThinkingIndicator({ thought, agent }: ThinkingIndicatorProps) {
    return (
        <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm relative" style={{ backgroundColor: agent?.color ? `${agent.color}20` : '#ec489920' }}>
                <span className="animate-pulse">{agent?.avatar_emoji || '🎨'}</span>
                <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: agent?.color || '#ec4899' }} />
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1a1a1a] border border-[#262626]">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm text-zinc-400 animate-pulse">{thought}</p>
                </div>
            </div>
        </div>
    );
}