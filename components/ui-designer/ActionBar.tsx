"use client";

import { DesignResult, DesignStatus, GeneratedFile } from '@/types/ui-designer';
import { LoaderIcon, FileCodeIcon, HashIcon, ClockIcon, CheckIcon, XIcon } from '@/components/ui/Icons';

interface ActionBarProps {
    status: DesignStatus;
    generatedFiles: GeneratedFile[];
    selectedFilesForApply: Set<string>;
    result: DesignResult | null;
    isApplying: boolean;
    isGenerating: boolean;
    onApply: () => void;
    onCancel: () => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export function ActionBar({
                              status,
                              generatedFiles,
                              selectedFilesForApply,
                              result,
                              isApplying,
                              isGenerating,
                              onApply,
                              onCancel,
                              onSelectAll,
                              onDeselectAll,
                          }: ActionBarProps) {
    const totalFiles = generatedFiles.length;
    const totalLines = generatedFiles.reduce((sum, f) => sum + f.line_count, 0);
    const selectedCount = selectedFilesForApply.size;
    const hasFiles = totalFiles > 0;
    const allSelected = selectedCount === totalFiles;

    return (
        <footer className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-t border-border-subtle bg-bg-surface">
            {/* Left: Stats */}
            <div className="flex items-center gap-4">
                {isGenerating ? (
                    <div className="flex items-center gap-2">
                        <LoaderIcon className="w-4 h-4 text-accent-primary animate-spin" />
                        <span className="text-sm text-text-secondary">Generating...</span>
                    </div>
                ) : hasFiles ? (
                    <>
                        <Stat icon={<FileCodeIcon className="w-4 h-4" />} value={totalFiles} label="files" />
                        <Stat icon={<HashIcon className="w-4 h-4" />} value={totalLines} label="lines" />
                        {result && (
                            <Stat icon={<ClockIcon className="w-4 h-4" />} value={`${(result.duration_ms / 1000).toFixed(1)}s`} label="" />
                        )}
                    </>
                ) : (
                    <span className="text-sm text-text-muted">Ready to generate UI</span>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {isGenerating ? (
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-status-error bg-status-error/10 border border-status-error/20 rounded-lg hover:bg-status-error/20 transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                        <span>Cancel</span>
                        <kbd className="text-xs opacity-60 ml-1">Esc</kbd>
                    </button>
                ) : hasFiles ? (
                    <>
                        {/* Selection toggle */}
                        <button
                            onClick={allSelected ? onDeselectAll : onSelectAll}
                            className="px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle rounded-lg hover:border-border-default transition-colors"
                        >
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </button>

                        {/* Apply button */}
                        <button
                            onClick={onApply}
                            disabled={selectedCount === 0 || isApplying}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent-primary to-accent-secondary rounded-lg hover:shadow-lg hover:shadow-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                        >
                            {isApplying ? (
                                <>
                                    <LoaderIcon className="w-4 h-4 animate-spin" />
                                    <span>Applying...</span>
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    <span>Apply {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
                                    <kbd className="text-xs opacity-60 ml-1">⌘S</kbd>
                                </>
                            )}
                        </button>
                    </>
                ) : null}
            </div>
        </footer>
    );
}

interface StatProps {
    icon: React.ReactNode;
    value: number | string;
    label: string;
}

function Stat({ icon, value, label }: StatProps) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">{icon}</span>
            <span className="font-medium text-text-primary">{value}</span>
            {label && <span className="text-text-muted">{label}</span>}
        </div>
    );
}