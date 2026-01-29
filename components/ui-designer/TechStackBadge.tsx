"use client";

import { TechStack } from '@/types/ui-designer';

interface TechStackBadgeProps {
    techStack: TechStack;
}

const FRAMEWORK_ICONS: Record<string, string> = { react: '⚛️', vue: '💚', blade: '🔺', livewire: '⚡', unknown: '📦' };
const CSS_ICONS: Record<string, string> = { tailwind: '🎨', bootstrap: '🅱️', custom: '✨', none: '📝' };

export function TechStackBadge({ techStack }: TechStackBadgeProps) {
    return (
        <div className="flex items-center gap-2 py-2 animate-in slide-in-from-left-2 duration-200 flex-wrap">
            <span className="text-xs text-zinc-500">Detected:</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#262626]">
                <span>{FRAMEWORK_ICONS[techStack.framework] || '📦'}</span>
                <span className="text-xs text-zinc-300 capitalize">{techStack.framework}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#262626]">
                <span>{CSS_ICONS[techStack.css_framework] || '🎨'}</span>
                <span className="text-xs text-zinc-300 capitalize">{techStack.css_framework}</span>
            </div>
            {techStack.typescript && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span>📘</span>
                    <span className="text-xs text-blue-400">TypeScript</span>
                </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="text-xs text-green-400">{Math.round(techStack.confidence * 100)}% confident</span>
            </div>
        </div>
    );
}