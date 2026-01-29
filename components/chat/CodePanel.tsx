"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { useChat } from "@/hooks/useChat";
import { getActionIcon } from "@/types/chat";

interface CodePanelProps {
    chat: ReturnType<typeof useChat>;
}

export function CodePanel({ chat }: CodePanelProps) {
    const files = useMemo(() => Array.from(chat.codeChunks.keys()), [chat.codeChunks]);
    const selectedCode = chat.selectedFile ? chat.codeChunks.get(chat.selectedFile) || "" : "";

    // Get file extension for syntax highlighting hint
    const getFileExtension = (path: string) => path.split(".").pop() || "";

    if (files.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center">
                <CodeIcon className="h-12 w-12 text-text-muted mb-4" />
                <p className="text-sm text-text-muted">No code changes yet</p>
                <p className="text-xs text-text-muted mt-1">
                    Code changes will appear here during execution
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-primary">Code Changes</h3>
                    <Badge variant="accent">{files.length} files</Badge>
                </div>
            </div>

            {/* File Tabs */}
            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-2 border-b border-border-subtle overflow-x-auto scrollbar-thin">
                {files.map((file) => {
                    const result = chat.executionResults.find((r) => r.file === file);
                    return (
                        <button
                            key={file}
                            onClick={() => chat.setSelectedFile(file)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                                chat.selectedFile === file
                                    ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                                    : "text-text-secondary hover:bg-bg-elevated border border-transparent"
                            }`}
                        >
                            {result && (
                                <span className="text-xs">{getActionIcon(result.action)}</span>
                            )}
                            <span>{file.split("/").pop()}</span>
                            {result && !result.success && (
                                <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* File Path */}
            {chat.selectedFile && (
                <div className="flex-shrink-0 px-4 py-2 bg-bg-base border-b border-border-subtle">
                    <p className="text-xs font-mono text-text-muted truncate">{chat.selectedFile}</p>
                </div>
            )}

            {/* Code Content */}
            <div className="flex-1 overflow-auto bg-bg-base">
                <pre className="p-4 text-xs font-mono text-text-primary whitespace-pre-wrap leading-relaxed">
                    {selectedCode || "Select a file to view code"}
                </pre>
            </div>

            {/* Validation Status */}
            {chat.validationResult && (
                <div className="flex-shrink-0 px-4 py-3 border-t border-border-subtle bg-bg-surface">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {chat.validationResult.approved ? (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 text-status-success" />
                                    <span className="text-sm text-status-success">Validation passed</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircleIcon className="h-4 w-4 text-status-warning" />
                                    <span className="text-sm text-status-warning">
                                        {chat.validationResult.issues.length} issues found
                                    </span>
                                </>
                            )}
                        </div>
                        <span className="text-xs text-text-muted">
                            Score: {chat.validationResult.score}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Icons
// ============================================================================

function CodeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function AlertCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}