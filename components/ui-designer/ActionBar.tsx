"use client";

import {DesignResult, DesignStatus, GeneratedFile} from '@/types/ui-designer';

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
        <footer
            className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-t border-[#262626] bg-[#141414]">
            {/* Left: Stats */}
            <div className="flex items-center gap-4">
                {isGenerating ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"/>
                        <span className="text-sm text-zinc-400">Generating...</span>
                    </div>
                ) : hasFiles ? (
                    <>
                        <Stat icon="📄" value={totalFiles} label="files"/>
                        <Stat icon="📝" value={totalLines} label="lines"/>
                        {result && (
                            <Stat icon="⏱️" value={`${(result.duration_ms / 1000).toFixed(1)}s`} label=""/>
                        )}
                    </>
                ) : (
                    <span className="text-sm text-zinc-500">Ready to generate UI</span>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {isGenerating ? (
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                        <span>Cancel</span>
                        <kbd className="text-xs opacity-60">Esc</kbd>
                    </button>
                ) : hasFiles ? (
                    <>
                        {/* Selection toggle */}
                        <button
                            onClick={allSelected ? onDeselectAll : onSelectAll}
                            className="px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-[#333] transition-colors"
                        >
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </button>

                        {/* Apply button */}
                        <button
                            onClick={onApply}
                            disabled={selectedCount === 0 || isApplying}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isApplying ? (
                                <>
                                    <div
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    <span>Applying...</span>
                                </>
                            ) : (
                                <>
                                    <span>Apply {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
                                    <kbd className="text-xs opacity-60">⌘S</kbd>
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
    icon: string;
    value: number | string;
    label: string;
}

function Stat({icon, value, label}: StatProps) {
    return (
        <div className="flex items-center gap-1.5 text-sm">
            <span>{icon}</span>
            <span className="font-medium text-zinc-200">{value}</span>
            {label && <span className="text-zinc-500">{label}</span>}
        </div>
    );
}