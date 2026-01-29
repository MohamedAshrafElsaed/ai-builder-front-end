"use client";

import { Agent } from '@/types/ui-designer';
import { SparklesIcon } from '@/components/ui/Icons';

interface ThinkingIndicatorProps {
    thought: string;
    agent: Agent | null;
}

export function ThinkingIndicator({ thought, agent }: ThinkingIndicatorProps) {
    return (
        <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20 relative">
                <SparklesIcon className="w-4 h-4 text-accent-primary animate-pulse" />
                <span className="absolute inset-0 rounded-xl animate-ping opacity-20 bg-accent-primary" />
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-tl-md bg-bg-elevated border border-border-subtle">
                    <div className="flex gap-1">
                        <span
                            className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                            style={{ animationDelay: '0ms' }}
                        />
                        <span
                            className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                            style={{ animationDelay: '150ms' }}
                        />
                        <span
                            className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                            style={{ animationDelay: '300ms' }}
                        />
                    </div>
                    <p className="text-sm text-text-secondary animate-pulse">{thought}</p>
                </div>
            </div>
        </div>
    );
}