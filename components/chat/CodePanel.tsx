"use client";

import { useState, useMemo, useCallback, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExecutionResult, ValidationResult, PlanAction, getActionIcon } from "@/types/chat";

// ============================================================================
// Types
// ============================================================================

interface CodePanelProps {
    isOpen: boolean;
    onClose: () => void;
    codeChunks: Map<string, string>;
    executionResults: ExecutionResult[];
    validationResult: ValidationResult | null;
    selectedFile: string | null;
    onSelectFile: (file: string) => void;
    onApplyChanges?: (files: string[]) => void;
    isMobile?: boolean;
}

interface FileNode {
    name: string;
    path: string;
    isFolder: boolean;
    children: FileNode[];
    action?: PlanAction;
    success?: boolean;
}

// ============================================================================
// Syntax Highlighting Patterns
// ============================================================================

const SYNTAX_PATTERNS: Record<string, { pattern: RegExp; className: string }[]> = {
    typescript: [
        { pattern: /\/\/.*$/gm, className: "text-zinc-500 italic" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "text-zinc-500 italic" },
        { pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, className: "text-green-400" },
        { pattern: /\b(import|export|from|default|const|let|var|function|return|if|else|for|while|class|extends|interface|type|enum|async|await|try|catch|throw|new|this|super|static|public|private|protected|readonly|typeof|instanceof|in|of)\b/g, className: "text-purple-400" },
        { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: "text-orange-400" },
        { pattern: /\b(\d+\.?\d*)\b/g, className: "text-orange-400" },
        { pattern: /\b(React|useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)\b/g, className: "text-cyan-400" },
        { pattern: /<\/?([A-Z][a-zA-Z0-9]*)/g, className: "text-yellow-400" },
        { pattern: /\b([a-z_$][a-zA-Z0-9_$]*)\s*\(/g, className: "text-blue-400" },
    ],
    php: [
        { pattern: /\/\/.*$/gm, className: "text-zinc-500 italic" },
        { pattern: /\/\*[\s\S]*?\*\//g, className: "text-zinc-500 italic" },
        { pattern: /#.*$/gm, className: "text-zinc-500 italic" },
        { pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, className: "text-green-400" },
        { pattern: /\b(namespace|use|class|function|public|private|protected|static|return|if|else|foreach|for|while|new|extends|implements|trait|interface|abstract|final|throw|try|catch|finally)\b/g, className: "text-purple-400" },
        { pattern: /\$[a-zA-Z_][a-zA-Z0-9_]*/g, className: "text-red-400" },
    ],
    css: [
        { pattern: /\/\*[\s\S]*?\*\//g, className: "text-zinc-500 italic" },
        { pattern: /([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g, className: "text-yellow-400" },
        { pattern: /([a-z-]+)\s*:/g, className: "text-cyan-400" },
        { pattern: /#[0-9a-fA-F]{3,8}/g, className: "text-orange-400" },
        { pattern: /\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms)/g, className: "text-orange-400" },
    ],
    json: [
        { pattern: /"[^"]*"(?=\s*:)/g, className: "text-cyan-400" },
        { pattern: /"[^"]*"/g, className: "text-green-400" },
        { pattern: /\b(true|false|null)\b/g, className: "text-orange-400" },
        { pattern: /\b-?\d+\.?\d*\b/g, className: "text-orange-400" },
    ],
};

// ============================================================================
// Main Component
// ============================================================================

export function CodePanel({
                              isOpen,
                              onClose,
                              codeChunks,
                              executionResults,
                              validationResult,
                              selectedFile,
                              onSelectFile,
                              onApplyChanges,
                              isMobile = false,
                          }: CodePanelProps) {
    const [showDiff, setShowDiff] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [copiedFile, setCopiedFile] = useState<string | null>(null);
    const [focusedFileIndex, setFocusedFileIndex] = useState(0);
    const fileListRef = useRef<HTMLDivElement>(null);

    // Build file list
    const files = useMemo(() => codeChunks ? Array.from(codeChunks.keys()) : [], [codeChunks]);

    // Build file tree structure
    const fileTree = useMemo(() => buildFileTree(files, executionResults || []), [files, executionResults]);

    // Current file data
    const currentCode = selectedFile && codeChunks ? codeChunks.get(selectedFile) || "" : "";
    const currentResult = (executionResults || []).find((r) => r.file === selectedFile);
    const language = selectedFile ? getLanguage(selectedFile) : "text";

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedFileIndex((i) => Math.min(i + 1, files.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedFileIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && files[focusedFileIndex]) {
            onSelectFile(files[focusedFileIndex]);
        } else if (e.key === "Escape") {
            onClose();
        }
    }, [files, focusedFileIndex, onSelectFile, onClose]);

    // Copy code to clipboard
    const handleCopy = useCallback(async () => {
        if (!currentCode || !selectedFile) return;
        await navigator.clipboard.writeText(currentCode);
        setCopiedFile(selectedFile);
        setTimeout(() => setCopiedFile(null), 2000);
    }, [currentCode, selectedFile]);

    // Toggle file selection for apply
    const toggleFileSelection = useCallback((file: string) => {
        setSelectedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(file)) next.delete(file);
            else next.add(file);
            return next;
        });
    }, []);

    // Select/deselect all
    const toggleAll = useCallback(() => {
        if (selectedFiles.size === files.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(files));
        }
    }, [files, selectedFiles.size]);

    if (!isOpen) return null;

    // Mobile: Full-screen overlay
    if (isMobile) {
        return (
            <>
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="fixed inset-0 z-50 bg-bg-base flex flex-col animate-in slide-in-from-right duration-300">
                    <PanelContent
                        files={files}
                        fileTree={fileTree}
                        executionResults={executionResults || []}
                        selectedFile={selectedFile}
                        currentCode={currentCode}
                        currentResult={currentResult}
                        language={language}
                        showDiff={showDiff}
                        setShowDiff={setShowDiff}
                        selectedFiles={selectedFiles}
                        toggleFileSelection={toggleFileSelection}
                        toggleAll={toggleAll}
                        focusedFileIndex={focusedFileIndex}
                        setFocusedFileIndex={setFocusedFileIndex}
                        onSelectFile={onSelectFile}
                        onClose={onClose}
                        handleCopy={handleCopy}
                        copiedFile={copiedFile}
                        validationResult={validationResult}
                        onApplyChanges={onApplyChanges}
                        handleKeyDown={handleKeyDown}
                        fileListRef={fileListRef}
                        isMobile
                    />
                </div>
            </>
        );
    }

    // Desktop: Side panel
    return (
        <div className="w-[400px] border-l border-border-subtle bg-bg-surface flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
            <PanelContent
                files={files}
                fileTree={fileTree}
                executionResults={executionResults || []}
                selectedFile={selectedFile}
                currentCode={currentCode}
                currentResult={currentResult}
                language={language}
                showDiff={showDiff}
                setShowDiff={setShowDiff}
                selectedFiles={selectedFiles}
                toggleFileSelection={toggleFileSelection}
                toggleAll={toggleAll}
                focusedFileIndex={focusedFileIndex}
                setFocusedFileIndex={setFocusedFileIndex}
                onSelectFile={onSelectFile}
                onClose={onClose}
                handleCopy={handleCopy}
                copiedFile={copiedFile}
                validationResult={validationResult}
                onApplyChanges={onApplyChanges}
                handleKeyDown={handleKeyDown}
                fileListRef={fileListRef}
            />
        </div>
    );
}

// ============================================================================
// Panel Content
// ============================================================================

interface PanelContentProps {
    files: string[];
    fileTree: FileNode[];
    executionResults: ExecutionResult[];
    selectedFile: string | null;
    currentCode: string;
    currentResult: ExecutionResult | undefined;
    language: string;
    showDiff: boolean;
    setShowDiff: (v: boolean) => void;
    selectedFiles: Set<string>;
    toggleFileSelection: (f: string) => void;
    toggleAll: () => void;
    focusedFileIndex: number;
    setFocusedFileIndex: (i: number) => void;
    onSelectFile: (f: string) => void;
    onClose: () => void;
    handleCopy: () => void;
    copiedFile: string | null;
    validationResult: ValidationResult | null;
    onApplyChanges?: (files: string[]) => void;
    handleKeyDown: (e: KeyboardEvent) => void;
    fileListRef: React.RefObject<HTMLDivElement | null>;
    isMobile?: boolean;
}

function PanelContent({
                          files, fileTree, executionResults, selectedFile, currentCode, currentResult, language, showDiff, setShowDiff,
                          selectedFiles, toggleFileSelection, toggleAll, focusedFileIndex, setFocusedFileIndex,
                          onSelectFile, onClose, handleCopy, copiedFile, validationResult, onApplyChanges, handleKeyDown, fileListRef, isMobile,
                      }: PanelContentProps) {
    return (
        <>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-text-primary">Code Changes</h2>
                    <Badge variant="accent">{files.length} files</Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant={showDiff ? "secondary" : "ghost"} size="sm" onClick={() => setShowDiff(!showDiff)} className="text-xs">
                        <DiffIcon className="h-3.5 w-3.5 mr-1" />
                        Diff
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                        <XIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden" onKeyDown={handleKeyDown as any}>
                {/* File Tree Sidebar */}
                <div ref={fileListRef} className="w-44 flex-shrink-0 border-r border-border-subtle overflow-y-auto scrollbar-thin bg-bg-base" role="listbox">
                    <div className="p-1.5">
                        {/* Select all header */}
                        {onApplyChanges && files.length > 1 && (
                            <button onClick={toggleAll} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-text-muted hover:text-text-primary rounded transition-colors">
                                <CheckboxIcon checked={selectedFiles.size === files.length} />
                                <span>{selectedFiles.size === files.length ? "Deselect all" : "Select all"}</span>
                            </button>
                        )}
                        {/* File items */}
                        {files.map((file, i) => {
                            const result = executionResults?.find((r) => r.file === file);
                            const action = result?.action;
                            return (
                                <FileItem
                                    key={file}
                                    file={file}
                                    action={action}
                                    isSelected={selectedFile === file}
                                    isFocused={focusedFileIndex === i}
                                    isChecked={selectedFiles.has(file)}
                                    success={result?.success}
                                    onSelect={() => { onSelectFile(file); setFocusedFileIndex(i); }}
                                    onToggle={() => toggleFileSelection(file)}
                                    showCheckbox={!!onApplyChanges}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Code Viewer */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    {selectedFile && currentCode ? (
                        <>
                            {/* File header */}
                            <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-bg-elevated/50">
                                <div className="flex items-center gap-2 min-w-0">
                                    <FileIcon className="h-4 w-4 text-text-muted shrink-0" />
                                    <span className="text-xs font-mono text-text-secondary truncate">{selectedFile}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {currentResult?.action && (
                                        <Badge variant={getActionBadgeVariant(currentResult.action)} className="text-[10px]">
                                            {getActionIcon(currentResult.action)} {currentResult.action}
                                        </Badge>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
                                        {copiedFile === selectedFile ? <CheckIcon className="h-3.5 w-3.5 text-status-success" /> : <CopyIcon className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Code content */}
                            <div className="flex-1 overflow-auto bg-bg-base scrollbar-thin">
                                {showDiff && currentResult?.diff ? (
                                    <DiffView diff={currentResult.diff} />
                                ) : (
                                    <CodeHighlight code={currentCode} language={language} />
                                )}
                            </div>
                        </>
                    ) : (
                        <EmptyState filesCount={files.length} />
                    )}
                </div>
            </div>

            {/* Footer with validation & apply */}
            <ValidationFooter validationResult={validationResult} selectedFiles={selectedFiles} onApplyChanges={onApplyChanges} />
        </>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function FileItem({ file, action, isSelected, isFocused, isChecked, success, onSelect, onToggle, showCheckbox }: {
    file: string; action?: PlanAction; isSelected: boolean; isFocused: boolean; isChecked: boolean; success?: boolean;
    onSelect: () => void; onToggle: () => void; showCheckbox: boolean;
}) {
    const fileName = file.split("/").pop() || file;
    const folder = file.includes("/") ? file.substring(0, file.lastIndexOf("/")) : "";

    return (
        <div
            role="option"
            aria-selected={isSelected}
            onClick={onSelect}
            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all text-xs ${
                isSelected ? "bg-accent-primary/10 text-accent-primary" : isFocused ? "bg-bg-elevated text-text-primary" : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            }`}
        >
            {showCheckbox && (
                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="shrink-0">
                    <CheckboxIcon checked={isChecked} />
                </button>
            )}
            <span className="shrink-0">{action ? getActionIcon(action) : <FileIcon className="h-3.5 w-3.5" />}</span>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileName}</p>
                {folder && <p className="text-[10px] text-text-muted truncate">{folder}</p>}
            </div>
            {success === false && <span className="w-1.5 h-1.5 rounded-full bg-status-error shrink-0" />}
        </div>
    );
}

function CheckboxIcon({ checked }: { checked: boolean }) {
    return (
        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${checked ? "bg-accent-primary border-accent-primary" : "border-border-default bg-bg-base"}`}>
            {checked && <CheckIcon className="h-2.5 w-2.5 text-white" />}
        </div>
    );
}

function CodeHighlight({ code, language }: { code: string; language: string }) {
    const highlighted = useMemo(() => highlightCode(code, language), [code, language]);
    const lines = code.split("\n");

    return (
        <div className="flex text-xs font-mono">
            <div className="flex-shrink-0 py-3 px-2 text-right select-none border-r border-border-subtle bg-bg-elevated/30">
                {lines.map((_, i) => (
                    <div key={i} className="text-text-muted leading-5 h-5">{i + 1}</div>
                ))}
            </div>
            <pre className="flex-1 p-3 overflow-x-auto leading-5" dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
    );
}

function DiffView({ diff }: { diff: string }) {
    const lines = diff.split("\n");

    return (
        <div className="text-xs font-mono">
            {lines.map((line, i) => {
                let className = "px-3 py-0.5 leading-5";
                if (line.startsWith("+") && !line.startsWith("+++")) className += " bg-status-success/10 text-status-success";
                else if (line.startsWith("-") && !line.startsWith("---")) className += " bg-status-error/10 text-status-error";
                else if (line.startsWith("@@")) className += " bg-accent-primary/10 text-accent-primary";
                else className += " text-text-secondary";

                return <div key={i} className={className}>{line || " "}</div>;
            })}
        </div>
    );
}

function ValidationFooter({ validationResult, selectedFiles, onApplyChanges }: {
    validationResult: ValidationResult | null; selectedFiles: Set<string>; onApplyChanges?: (files: string[]) => void;
}) {
    if (!validationResult && !onApplyChanges) return null;

    const errorCount = validationResult?.issues.filter((i) => i.severity === "error").length || 0;
    const warningCount = validationResult?.issues.filter((i) => i.severity === "warning").length || 0;

    return (
        <div className="flex-shrink-0 border-t border-border-subtle p-3 bg-bg-surface space-y-3">
            {validationResult && (
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                        {validationResult.approved ? (
                            <span className="flex items-center gap-1.5 text-status-success"><CheckCircleIcon className="h-4 w-4" />Passed</span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-status-warning"><AlertCircleIcon className="h-4 w-4" />Issues found</span>
                        )}
                        {(errorCount > 0 || warningCount > 0) && (
                            <span className="text-text-muted">
                                {errorCount > 0 && <span className="text-status-error">{errorCount} error{errorCount !== 1 && "s"}</span>}
                                {errorCount > 0 && warningCount > 0 && " • "}
                                {warningCount > 0 && <span className="text-status-warning">{warningCount} warning{warningCount !== 1 && "s"}</span>}
                            </span>
                        )}
                    </div>
                    <Badge variant={validationResult.score >= 80 ? "success" : validationResult.score >= 50 ? "warning" : "error"}>
                        Score: {validationResult.score}%
                    </Badge>
                </div>
            )}

            {onApplyChanges && selectedFiles.size > 0 && (
                <Button className="w-full" onClick={() => onApplyChanges(Array.from(selectedFiles))}>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Apply {selectedFiles.size} file{selectedFiles.size !== 1 && "s"}
                </Button>
            )}
        </div>
    );
}

function EmptyState({ filesCount }: { filesCount: number }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <CodeIcon className="h-12 w-12 text-text-muted mb-4" />
            {filesCount === 0 ? (
                <>
                    <p className="text-sm text-text-muted">No code changes yet</p>
                    <p className="text-xs text-text-muted mt-1">Code changes will appear here during execution</p>
                </>
            ) : (
                <p className="text-sm text-text-muted">Select a file to view code</p>
            )}
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
        ts: "typescript", tsx: "typescript", js: "typescript", jsx: "typescript",
        php: "php", vue: "typescript", css: "css", scss: "css",
        json: "json", md: "text", html: "typescript", blade: "php",
    };
    return map[ext] || "typescript";
}

function getActionBadgeVariant(action: PlanAction): "success" | "warning" | "error" {
    return action === "create" ? "success" : action === "modify" ? "warning" : "error";
}

function highlightCode(code: string, language: string): string {
    const patterns = SYNTAX_PATTERNS[language] || SYNTAX_PATTERNS.typescript;
    let escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const placeholders: string[] = [];

    patterns.forEach(({ pattern, className }) => {
        escaped = escaped.replace(pattern, (match) => {
            const i = placeholders.length;
            placeholders.push(`<span class="${className}">${match}</span>`);
            return `__PH${i}__`;
        });
    });

    placeholders.forEach((r, i) => { escaped = escaped.replace(`__PH${i}__`, r); });
    return escaped;
}

function buildFileTree(files: string[], results: ExecutionResult[]): FileNode[] {
    const root: FileNode[] = [];
    files.forEach((path) => {
        const result = results.find((r) => r.file === path);
        const parts = path.split("/");
        let current = root;
        parts.forEach((part, i) => {
            const isLast = i === parts.length - 1;
            let node = current.find((n) => n.name === part);
            if (!node) {
                node = { name: part, path: parts.slice(0, i + 1).join("/"), isFolder: !isLast, children: [], action: isLast ? result?.action : undefined, success: isLast ? result?.success : undefined };
                current.push(node);
            }
            current = node.children;
        });
    });
    return root;
}

// ============================================================================
// Icons
// ============================================================================

function XIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

function CopyIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}

function FileIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" /></svg>;
}

function CodeIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
}

function DiffIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /><line x1="4" y1="12" x2="20" y2="12" /></svg>;
}

function CheckCircleIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>;
}

function AlertCircleIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}

function DownloadIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>;
}