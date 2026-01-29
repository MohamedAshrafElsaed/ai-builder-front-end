// app/app/ui-designer/demo/page.tsx - Demo page for testing without backend
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useUIDesignerDemo } from '@/hooks/useUIDesignerDemo';
import { ChatPanel } from '@/components/ui-designer/ChatPanel';
import { PreviewPanel } from '@/components/ui-designer/PreviewPanel';
import { ActionBar } from '@/components/ui-designer/ActionBar';
import { ResizableDivider } from '@/components/ui-designer/ResizableDivider';

export default function UIDesignerDemoPage() {
    const designer = useUIDesignerDemo('demo-project');
    const [leftWidth, setLeftWidth] = useState(380);
    const [isMobile, setIsMobile] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Initialize demo data
    useEffect(() => {
        designer.initialize();
    }, []);

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

    // Mobile view
    if (isMobile) {
        return (
            <div className="flex flex-col h-screen bg-[#0a0a0a]">
                <DemoHeader
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

    // Desktop view
    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a]">
            <DemoHeader />

            <div className="flex-1 flex overflow-hidden">
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

interface DemoHeaderProps {
    showToggle?: boolean;
    showPreview?: boolean;
    onToggle?: () => void;
}

function DemoHeader({ showToggle, showPreview, onToggle }: DemoHeaderProps) {
    return (
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-[#262626] bg-[#141414]">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    <div>
                        <h1 className="text-sm font-semibold text-zinc-100">UI Designer</h1>
                        <p className="text-xs text-zinc-500">Demo Mode</p>
                    </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    DEMO
                </span>
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