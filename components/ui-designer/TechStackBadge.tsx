"use client";

import { TechStack } from '@/types/ui-designer';
import { ReactIcon, VueIcon, TypeScriptIcon, CssIcon, BoxIcon, CheckCircleIcon } from '@/components/ui/Icons';

interface TechStackBadgeProps {
    techStack: TechStack;
}

export function TechStackBadge({ techStack }: TechStackBadgeProps) {
    const getFrameworkIcon = (framework: string) => {
        switch (framework) {
            case 'react': return <ReactIcon className="w-3.5 h-3.5 text-[#61DAFB]" />;
            case 'vue': return <VueIcon className="w-3.5 h-3.5 text-[#42B883]" />;
            default: return <BoxIcon className="w-3.5 h-3.5 text-text-secondary" />;
        }
    };

    return (
        <div className="flex items-center gap-2 py-2 animate-in slide-in-from-left-2 duration-200 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Detected</span>

            {/* Framework */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle hover:border-border-default transition-colors">
                {getFrameworkIcon(techStack.framework)}
                <span className="text-xs text-text-primary capitalize font-medium">{techStack.framework}</span>
            </div>

            {/* CSS Framework */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle hover:border-border-default transition-colors">
                <CssIcon className="w-3.5 h-3.5 text-[#264de4]" />
                <span className="text-xs text-text-primary capitalize font-medium">{techStack.css_framework}</span>
            </div>

            {/* TypeScript */}
            {techStack.typescript && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-status-info/10 border border-status-info/20">
                    <TypeScriptIcon className="w-3.5 h-3.5 text-status-info" />
                    <span className="text-xs text-status-info font-medium">TypeScript</span>
                </div>
            )}

            {/* Confidence */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-status-success/10 border border-status-success/20">
                <CheckCircleIcon className="w-3.5 h-3.5 text-status-success" />
                <span className="text-xs text-status-success font-medium">{Math.round(techStack.confidence * 100)}%</span>
            </div>
        </div>
    );
}