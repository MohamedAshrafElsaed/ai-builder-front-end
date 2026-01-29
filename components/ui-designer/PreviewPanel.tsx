"use client";

import { useState, useCallback } from 'react';
import { ActiveTab, GeneratedFile, getFileIcon, getFileExtension } from '@/types/ui-designer';
import { CodeViewer } from './CodeViewer';
import { FileTree } from './FileTree';

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
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Tabs */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 h-12 border-b border-[#1f1f1f] bg-[#141414]">
                <div className="flex items-center gap-1">
                    <TabButton
                        active={activeTab === 'preview'}
                        onClick={() => setActiveTab('preview')}
                        shortcut="⌘1"
                    >
                        Preview
                    </TabButton>
                    <TabButton
                        active={activeTab === 'code'}
                        onClick={() => setActiveTab('code')}
                        shortcut="⌘2"
                    >
                        Code
                    </TabButton>
                    <TabButton
                        active={activeTab === 'files'}
                        onClick={() => setActiveTab('files')}
                        badge={generatedFiles.length > 0 ? generatedFiles.length : undefined}
                        shortcut="⌘3"
                    >
                        Files
                    </TabButton>
                </div>

                {generatedFiles.length > 0 && (
                    <button
                        onClick={downloadAll}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-[#1a1a1a] border border-[#262626] rounded-md hover:border-[#333] transition-colors"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        Download All
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'preview' && (
                    <PreviewTab
                        currentFile={currentFile}
                        streamingCode={streamingCode}
                        isGenerating={isGenerating}
                    />
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
    badge?: number;
    shortcut?: string;
}

function TabButton({ active, onClick, children, badge, shortcut }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                active
                    ? 'text-pink-400 bg-pink-500/10'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]'
            }`}
        >
            {children}
            {badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-pink-500/20 text-pink-400">
                    {badge}
                </span>
            )}
            {shortcut && (
                <kbd className="hidden md:inline text-[10px] opacity-50">{shortcut}</kbd>
            )}
        </button>
    );
}

interface PreviewTabProps {
    currentFile: GeneratedFile | null;
    streamingCode: string;
    isGenerating: boolean;
}

function PreviewTab({ currentFile, streamingCode, isGenerating }: PreviewTabProps) {
    // For now, show a placeholder. Real preview would need iframe sandbox
    return (
        <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
            <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
                    <span className="text-3xl">👁️</span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Live Preview</h3>
                <p className="text-sm text-zinc-500 max-w-xs">
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
    // Show streaming code when generating and no files yet
    const showStreaming = isGenerating && streamingCode && generatedFiles.length === 0;

    return (
        <div className="flex flex-col h-full">
            {/* File Tabs */}
            {generatedFiles.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-1 px-2 py-2 overflow-x-auto border-b border-[#1f1f1f] bg-[#0f0f0f] scrollbar-thin">
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

            {/* Code Viewer */}
            <div className="flex-1 overflow-hidden relative">
                {showStreaming ? (
                    <CodeViewer
                        code={streamingCode}
                        language="tsx"
                        isStreaming
                    />
                ) : currentFile ? (
                    <>
                        <CodeViewer
                            code={currentFile.content}
                            language={currentFile.language}
                        />
                        {/* Actions */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <button
                                onClick={() => copyToClipboard(currentFile.content, selectedFileIndex)}
                                className="p-2 rounded-md bg-[#1a1a1a]/90 border border-[#262626] text-zinc-400 hover:text-zinc-200 hover:border-[#333] backdrop-blur-sm transition-colors"
                                title="Copy code"
                            >
                                {copiedIndex === selectedFileIndex ? (
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                ) : (
                                    <CopyIcon className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => downloadFile(currentFile)}
                                className="p-2 rounded-md bg-[#1a1a1a]/90 border border-[#262626] text-zinc-400 hover:text-zinc-200 hover:border-[#333] backdrop-blur-sm transition-colors"
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

interface FileTabProps {
    file: GeneratedFile;
    isActive: boolean;
    onClick: () => void;
}

function FileTab({ file, isActive, onClick }: FileTabProps) {
    const fileName = file.path.split('/').pop() || file.path;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                    ? 'bg-[#1a1a1a] text-zinc-200 border border-[#333]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#141414]'
            }`}
        >
            <span>{getFileIcon(file.language)}</span>
            <span className="max-w-[150px] truncate">{fileName}</span>
            <span className="text-zinc-600">{file.line_count}L</span>
        </button>
    );
}

function EmptyCodeState({ isGenerating }: { isGenerating: boolean }) {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
                    <span className="text-3xl">{isGenerating ? '⚡' : '📝'}</span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">
                    {isGenerating ? 'Generating...' : 'No Code Yet'}
                </h3>
                <p className="text-sm text-zinc-500 max-w-xs">
                    {isGenerating
                        ? 'Code will appear here as it\'s generated.'
                        : 'Describe the UI you want and I\'ll generate the code for you.'}
                </p>
            </div>
        </div>
    );
}

// Icons
function CopyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function DownloadIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    );
}