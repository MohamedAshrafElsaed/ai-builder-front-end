"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIDesigner } from '@/hooks/useUIDesigner';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { ActionBar } from './ActionBar';
import { ResizableDivider } from './ResizableDivider';

interface UIDesignerLayoutProps {
    projectId: string;
}

export function UIDesignerLayout({ projectId }: UIDesignerLayoutProps) {
    const router = useRouter();
    const designer = useUIDesigner(projectId);
    const [leftWidth, setLeftWidth] = useState(400);
    const [isMobile, setIsMobile] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setShowPreview(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (designer.generatedFiles.length > 0 && !designer.isApplying) {
                    designer.applyDesign();
                }
            }
            if (e.key === 'Escape' && designer.isGenerating) {
                designer.cancelGeneration();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [designer]);

    const handleResize = useCallback((delta: number) => {
        setLeftWidth((prev) => Math.max(340, Math.min(600, prev + delta)));
    }, []);

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-[#09090b]">
                <DesignerHeader
                    projectId={projectId}
                    onBack={() => router.push('/app/ui-designer')}
                    showToggle
                    showPreview={showPreview}
                    onToggle={() => setShowPreview(!showPreview)}
                />
                <div className="flex-1 overflow-hidden">
                    {showPreview ? (
                        <PreviewPanel
                            activeTab={designer.activeTab}
                            setActiveTab={designer.setActiveTab}
                            streamingCode={designer.streamingCode}
                            generatedFiles={designer.generatedFiles}
                            selectedFileIndex={designer.selectedFileIndex}
                            selectFile={designer.selectFile}
                            selectedFilesForApply={designer.selectedFilesForApply}
                            toggleFileSelection={designer.toggleFileSelection}
                            isGenerating={designer.isGenerating}
                        />
                    ) : (
                        <ChatPanel
                            agent={designer.agent}
                            messages={designer.messages}
                            currentThought={designer.currentThought}
                            techStack={designer.techStack}
                            status={designer.status}
                            isGenerating={designer.isGenerating}
                            onSendMessage={(prompt) => designer.startGeneration({ prompt })}
                            onCancel={designer.cancelGeneration}
                        />
                    )}
                </div>
                <ActionBar
                    status={designer.status}
                    generatedFiles={designer.generatedFiles}
                    selectedFilesForApply={designer.selectedFilesForApply}
                    result={designer.result}
                    isApplying={designer.isApplying}
                    isGenerating={designer.isGenerating}
                    onApply={() => designer.applyDesign()}
                    onCancel={designer.cancelGeneration}
                    onSelectAll={designer.selectAllFiles}
                    onDeselectAll={designer.deselectAllFiles}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#09090b]">
            <DesignerHeader projectId={projectId} onBack={() => router.push('/app/ui-designer')} />
            <div className="flex-1 flex overflow-hidden">
                <div style={{ width: leftWidth }} className="flex-shrink-0 border-r border-white/5">
                    <ChatPanel
                        agent={designer.agent}
                        messages={designer.messages}
                        currentThought={designer.currentThought}
                        techStack={designer.techStack}
                        status={designer.status}
                        isGenerating={designer.isGenerating}
                        onSendMessage={(prompt) => designer.startGeneration({ prompt })}
                        onCancel={designer.cancelGeneration}
                    />
                </div>
                <ResizableDivider onResize={handleResize} />
                <div className="flex-1 overflow-hidden">
                    <PreviewPanel
                        activeTab={designer.activeTab}
                        setActiveTab={designer.setActiveTab}
                        streamingCode={designer.streamingCode}
                        generatedFiles={designer.generatedFiles}
                        selectedFileIndex={designer.selectedFileIndex}
                        selectFile={designer.selectFile}
                        selectedFilesForApply={designer.selectedFilesForApply}
                        toggleFileSelection={designer.toggleFileSelection}
                        isGenerating={designer.isGenerating}
                    />
                </div>
            </div>
            <ActionBar
                status={designer.status}
                generatedFiles={designer.generatedFiles}
                selectedFilesForApply={designer.selectedFilesForApply}
                result={designer.result}
                isApplying={designer.isApplying}
                isGenerating={designer.isGenerating}
                onApply={() => designer.applyDesign()}
                onCancel={designer.cancelGeneration}
                onSelectAll={designer.selectAllFiles}
                onDeselectAll={designer.deselectAllFiles}
            />
        </div>
    );
}

interface DesignerHeaderProps {
    projectId: string;
    onBack: () => void;
    showToggle?: boolean;
    showPreview?: boolean;
    onToggle?: () => void;
}

function DesignerHeader({ projectId, onBack, showToggle, showPreview, onToggle }: DesignerHeaderProps) {
    return (
        <header className="h-12 flex-shrink-0 flex items-center justify-between px-3 border-b border-white/5 bg-[#09090b]">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-1.5 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                    <span className="text-xs">✨</span>
                </div>
                <span className="text-sm font-medium text-zinc-100">UI Designer</span>
            </div>

            <div className="flex items-center gap-2">
                {showToggle && (
                    <button
                        onClick={onToggle}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-colors"
                    >
                        {showPreview ? 'Chat' : 'Code'}
                    </button>
                )}
            </div>
        </header>
    );
}