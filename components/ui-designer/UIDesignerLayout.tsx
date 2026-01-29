"use client";

import { useState, useCallback, useEffect } from 'react';
import { useUIDesigner } from '@/hooks/useUIDesigner';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { ActionBar } from './ActionBar';
import { ResizableDivider } from './ResizableDivider';

interface UIDesignerLayoutProps {
    projectId: string;
}

export function UIDesignerLayout({ projectId }: UIDesignerLayoutProps) {
    const designer = useUIDesigner(projectId);
    const [leftWidth, setLeftWidth] = useState(380);
    const [isMobile, setIsMobile] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Handle responsive layout
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

    // Handle keyboard shortcuts
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
            if ((e.metaKey || e.ctrlKey) && e.key === '1') {
                e.preventDefault();
                designer.setActiveTab('preview');
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '2') {
                e.preventDefault();
                designer.setActiveTab('code');
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '3') {
                e.preventDefault();
                designer.setActiveTab('files');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [designer]);

    const handleResize = useCallback((delta: number) => {
        setLeftWidth((prev) => Math.max(320, Math.min(600, prev + delta)));
    }, []);

    // Mobile view toggle
    if (isMobile) {
        return (
            <div className="flex flex-col h-screen bg-[#0a0a0a]">
                {/* Header */}
                <DesignerHeader
                    projectId={projectId}
                    showToggle
                    showPreview={showPreview}
                    onToggle={() => setShowPreview(!showPreview)}
                />

                {/* Content */}
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

                {/* Action Bar */}
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

    // Desktop view
    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a]">
            {/* Header */}
            <DesignerHeader projectId={projectId} />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat Panel */}
                <div style={{ width: leftWidth }} className="flex-shrink-0 border-r border-[#262626]">
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

                {/* Resizable Divider */}
                <ResizableDivider onResize={handleResize} />

                {/* Preview Panel */}
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

            {/* Action Bar */}
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
    showToggle?: boolean;
    showPreview?: boolean;
    onToggle?: () => void;
}

function DesignerHeader({ projectId, showToggle, showPreview, onToggle }: DesignerHeaderProps) {
    return (
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-[#262626] bg-[#141414]">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    <div>
                        <h1 className="text-sm font-semibold text-zinc-100">UI Designer</h1>
                        <p className="text-xs text-zinc-500">Project: {projectId}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {showToggle && (
                    <button
                        onClick={onToggle}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#262626] text-zinc-300 hover:bg-[#333] transition-colors"
                    >
                        {showPreview ? 'Show Chat' : 'Show Code'}
                    </button>
                )}

                <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <kbd className="px-1.5 py-0.5 rounded bg-[#262626] text-zinc-400">⌘K</kbd>
                    <span>Focus</span>
                </div>
            </div>
        </header>
    );
}