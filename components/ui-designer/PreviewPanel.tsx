"use client";

import { useState, useCallback } from 'react';
import { ActiveTab, GeneratedFile } from '@/types/ui-designer';
import { CodeViewer } from './CodeViewer';
import { FileTree } from './FileTree';
import {
    EyeIcon, CodeIcon, LayersIcon, DownloadIcon, CopyIcon, CheckIcon,
    FileCodeIcon, ReactIcon, VueIcon, CssIcon, ZapIcon
} from '@/components/ui/Icons';

interface PreviewPanelProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    streamingCode: string;
    generatedFiles: GeneratedFile[];
    selectedFileIndex: number;
    selectFile: (index: number) => void;
    selectedFilesForApply: Set<string>;
    toggleFileSelection: (path: string) => void;
    isGenerating: boolean;
}

function getFileIcon(language: string, className: string = "w-4 h-4") {
    switch (language) {
        case 'tsx':
        case 'jsx':
            return <ReactIcon className={className} />;
        case 'vue':
            return <VueIcon className={className} />;
        case 'css':
        case 'scss':
            return <CssIcon className={className} />;
        default:
            return <FileCodeIcon className={className} />;
    }
}

export function PreviewPanel({
                                 activeTab,
                                 setActiveTab,
                                 streamingCode,
                                 generatedFiles,
                                 selectedFileIndex,
                                 selectFile,
                                 selectedFilesForApply,
                                 toggleFileSelection,
                                 isGenerating,
                             }: PreviewPanelProps) {
    const currentFile = generatedFiles[selectedFileIndex] || null;
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const copyToClipboard = useCallback(async (content: string, index: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, []);

    const downloadFile = useCallback((file: GeneratedFile) => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.path.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const downloadAll = useCallback(() => {
        generatedFiles.forEach((file) => downloadFile(file));
    }, [generatedFiles, downloadFile]);

    return (
        <div className="flex flex-col h-full bg-bg-base">
            {/* Tabs */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 h-12 border-b border-border-subtle bg-bg-surface">
                <div className="flex items-center gap-1">
                    <TabButton
                        active={activeTab === 'preview'}
                        onClick={() => setActiveTab('preview')}
                        icon={<EyeIcon className="w-4 h-4" />}
                        shortcut="⌘1"
                    >
                        Preview
                    </TabButton>
                    <TabButton
                        active={activeTab === 'code'}
                        onClick={() => setActiveTab('code')}
                        icon={<CodeIcon className="w-4 h-4" />}
                        shortcut="⌘2"
                    >
                        Code
                    </TabButton>
                    <TabButton
                        active={activeTab === 'files'}
                        onClick={() => setActiveTab('files')}
                        icon={<LayersIcon className="w-4 h-4" />}
                        badge={generatedFiles.length > 0 ? generatedFiles.length : undefined}
                        shortcut="⌘3"
                    >
                        Files
                    </TabButton>
                </div>

                {generatedFiles.length > 0 && (
                    <button
                        onClick={downloadAll}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle rounded-lg hover:border-border-default transition-colors"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        Download All
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'preview' && (
                    <PreviewTab currentFile={currentFile} streamingCode={streamingCode} isGenerating={isGenerating} />
                )}

                {activeTab === 'code' && (
                    <CodeTab
                        currentFile={currentFile}
                        streamingCode={streamingCode}
                        generatedFiles={generatedFiles}
                        selectedFileIndex={selectedFileIndex}
                        selectFile={selectFile}
                        copiedIndex={copiedIndex}
                        copyToClipboard={copyToClipboard}
                        downloadFile={downloadFile}
                        isGenerating={isGenerating}
                    />
                )}

                {activeTab === 'files' && (
                    <FileTree
                        files={generatedFiles}
                        selectedIndex={selectedFileIndex}
                        onSelect={selectFile}
                        selectedForApply={selectedFilesForApply}
                        onToggleApply={toggleFileSelection}
                    />
                )}
            </div>
        </div>
    );
}

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    badge?: number;
    shortcut?: string;
}

function TabButton({ active, onClick, children, icon, badge, shortcut }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                active
                    ? 'text-accent-primary bg-accent-primary/10 border border-accent-primary/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent'
            }`}
        >
            {icon}
            {children}
            {badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-accent-primary/20 text-accent-primary">
                    {badge}
                </span>
            )}
            {shortcut && (
                <kbd className="hidden md:inline text-[10px] opacity-50 ml-1">{shortcut}</kbd>
            )}
        </button>
    );
}

function PreviewTab({ currentFile, streamingCode, isGenerating }: { currentFile: GeneratedFile | null; streamingCode: string; isGenerating: boolean }) {
    return (
        <div className="h-full flex items-center justify-center bg-bg-base">
            <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center">
                    <EyeIcon className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">Live Preview</h3>
                <p className="text-sm text-text-muted max-w-xs">
                    {currentFile
                        ? 'Preview is available after applying files to your project.'
                        : isGenerating
                            ? 'Generating components...'
                            : 'Generate some UI to see a preview here.'}
                </p>
            </div>
        </div>
    );
}

interface CodeTabProps {
    currentFile: GeneratedFile | null;
    streamingCode: string;
    generatedFiles: GeneratedFile[];
    selectedFileIndex: number;
    selectFile: (index: number) => void;
    copiedIndex: number | null;
    copyToClipboard: (content: string, index: number) => void;
    downloadFile: (file: GeneratedFile) => void;
    isGenerating: boolean;
}

function CodeTab({
                     currentFile,
                     streamingCode,
                     generatedFiles,
                     selectedFileIndex,
                     selectFile,
                     copiedIndex,
                     copyToClipboard,
                     downloadFile,
                     isGenerating,
                 }: CodeTabProps) {
    const showStreaming = isGenerating && streamingCode && generatedFiles.length === 0;

    return (
        <div className="flex flex-col h-full">
            {generatedFiles.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-1 px-2 py-2 overflow-x-auto border-b border-border-subtle bg-bg-surface scrollbar-thin">
                    {generatedFiles.map((file, index) => (
                        <FileTab
                            key={file.path}
                            file={file}
                            isActive={index === selectedFileIndex}
                            onClick={() => selectFile(index)}
                        />
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-hidden relative">
                {showStreaming ? (
                    <CodeViewer code={streamingCode} language="tsx" isStreaming />
                ) : currentFile ? (
                    <>
                        <CodeViewer code={currentFile.content} language={currentFile.language} />
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <button
                                onClick={() => copyToClipboard(currentFile.content, selectedFileIndex)}
                                className="p-2 rounded-lg bg-bg-surface/90 border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default backdrop-blur-sm transition-colors"
                                title="Copy code"
                            >
                                {copiedIndex === selectedFileIndex ? (
                                    <CheckIcon className="w-4 h-4 text-status-success" />
                                ) : (
                                    <CopyIcon className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => downloadFile(currentFile)}
                                className="p-2 rounded-lg bg-bg-surface/90 border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default backdrop-blur-sm transition-colors"
                                title="Download file"
                            >
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <EmptyCodeState isGenerating={isGenerating} />
                )}
            </div>
        </div>
    );
}

function FileTab({ file, isActive, onClick }: { file: GeneratedFile; isActive: boolean; onClick: () => void }) {
    const fileName = file.path.split('/').pop() || file.path;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                    ? 'bg-bg-elevated text-text-primary border border-border-default'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent'
            }`}
        >
            {getFileIcon(file.language, "w-3.5 h-3.5")}
            <span className="max-w-[150px] truncate">{fileName}</span>
            <span className="text-text-muted">{file.line_count}L</span>
        </button>
    );
}

function EmptyCodeState({ isGenerating }: { isGenerating: boolean }) {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center">
                    {isGenerating ? (
                        <ZapIcon className="w-8 h-8 text-accent-primary animate-pulse" />
                    ) : (
                        <CodeIcon className="w-8 h-8 text-text-muted" />
                    )}
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">
                    {isGenerating ? 'Generating...' : 'No Code Yet'}
                </h3>
                <p className="text-sm text-text-muted max-w-xs">
                    {isGenerating
                        ? 'Code will appear here as it\'s generated.'
                        : 'Describe the UI you want and I\'ll generate the code for you.'}
                </p>
            </div>
        </div>
    );
}