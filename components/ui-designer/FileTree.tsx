"use client";

import { useMemo, useState } from 'react';
import { GeneratedFile, getFileIcon } from '@/types/ui-designer';

interface FileTreeProps {
    files: GeneratedFile[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    selectedForApply: Set<string>;
    onToggleApply: (path: string) => void;
}

interface TreeNode {
    name: string;
    path: string;
    isFolder: boolean;
    children: TreeNode[];
    file?: GeneratedFile;
    fileIndex?: number;
}

export function FileTree({
                             files,
                             selectedIndex,
                             onSelect,
                             selectedForApply,
                             onToggleApply,
                         }: FileTreeProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Build tree structure from flat file list
    const tree = useMemo(() => {
        const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };

        files.forEach((file, index) => {
            const parts = file.path.split('/');
            let current = root;

            parts.forEach((part, partIndex) => {
                const isLast = partIndex === parts.length - 1;
                const existingChild = current.children.find((c) => c.name === part);

                if (existingChild) {
                    current = existingChild;
                } else {
                    const newNode: TreeNode = {
                        name: part,
                        path: parts.slice(0, partIndex + 1).join('/'),
                        isFolder: !isLast,
                        children: [],
                        file: isLast ? file : undefined,
                        fileIndex: isLast ? index : undefined,
                    };
                    current.children.push(newNode);
                    current = newNode;
                }
            });
        });

        // Sort: folders first, then alphabetically
        const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1;
                if (!a.isFolder && b.isFolder) return 1;
                return a.name.localeCompare(b.name);
            }).map((node) => ({
                ...node,
                children: sortNodes(node.children),
            }));
        };

        return sortNodes(root.children);
    }, [files]);

    // Expand all folders by default
    useMemo(() => {
        const allFolders = new Set<string>();
        const collectFolders = (nodes: TreeNode[]) => {
            nodes.forEach((node) => {
                if (node.isFolder) {
                    allFolders.add(node.path);
                    collectFolders(node.children);
                }
            });
        };
        collectFolders(tree);
        setExpandedFolders(allFolders);
    }, [tree]);

    const toggleFolder = (path: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    if (files.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
                        <span className="text-3xl">📁</span>
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-200 mb-2">No Files Yet</h3>
                    <p className="text-sm text-zinc-500">Generated files will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto p-4 scrollbar-thin">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-400">Generated Files</h3>
                <span className="text-xs text-zinc-600">
                    {selectedForApply.size} of {files.length} selected
                </span>
            </div>

            <div className="space-y-0.5">
                {tree.map((node) => (
                    <TreeNodeItem
                        key={node.path}
                        node={node}
                        depth={0}
                        expanded={expandedFolders}
                        onToggle={toggleFolder}
                        selectedIndex={selectedIndex}
                        onSelect={onSelect}
                        selectedForApply={selectedForApply}
                        onToggleApply={onToggleApply}
                    />
                ))}
            </div>
        </div>
    );
}

interface TreeNodeItemProps {
    node: TreeNode;
    depth: number;
    expanded: Set<string>;
    onToggle: (path: string) => void;
    selectedIndex: number;
    onSelect: (index: number) => void;
    selectedForApply: Set<string>;
    onToggleApply: (path: string) => void;
}

function TreeNodeItem({
                          node,
                          depth,
                          expanded,
                          onToggle,
                          selectedIndex,
                          onSelect,
                          selectedForApply,
                          onToggleApply,
                      }: TreeNodeItemProps) {
    const isExpanded = expanded.has(node.path);
    const isSelected = node.fileIndex === selectedIndex;
    const isChecked = node.file ? selectedForApply.has(node.file.path) : false;

    if (node.isFolder) {
        return (
            <div>
                <button
                    onClick={() => onToggle(node.path)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-[#1a1a1a] transition-colors"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    <span className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        ▶
                    </span>
                    <span className="text-sm">📁</span>
                    <span className="text-sm text-zinc-300 truncate">{node.name}</span>
                </button>
                {isExpanded && (
                    <div>
                        {node.children.map((child) => (
                            <TreeNodeItem
                                key={child.path}
                                node={child}
                                depth={depth + 1}
                                expanded={expanded}
                                onToggle={onToggle}
                                selectedIndex={selectedIndex}
                                onSelect={onSelect}
                                selectedForApply={selectedForApply}
                                onToggleApply={onToggleApply}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-pink-500/10 border border-pink-500/20'
                    : 'hover:bg-[#1a1a1a] border border-transparent'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => node.fileIndex !== undefined && onSelect(node.fileIndex)}
        >
            {/* Checkbox */}
            <label
                className="flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => node.file && onToggleApply(node.file.path)}
                    className="w-4 h-4 rounded border-zinc-600 bg-[#1a1a1a] text-pink-500 focus:ring-pink-500/20 focus:ring-offset-0 cursor-pointer"
                />
            </label>

            {/* Icon */}
            <span className="text-sm flex-shrink-0">
                {node.file ? getFileIcon(node.file.language) : '📄'}
            </span>

            {/* Name */}
            <span className={`text-sm truncate flex-1 ${isSelected ? 'text-pink-400' : 'text-zinc-300'}`}>
                {node.name}
            </span>

            {/* File info */}
            {node.file && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-zinc-600">
                        {node.file.line_count}L
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        node.file.type === 'component'
                            ? 'bg-purple-500/10 text-purple-400'
                            : node.file.type === 'style'
                                ? 'bg-cyan-500/10 text-cyan-400'
                                : node.file.type === 'test'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                        {node.file.type}
                    </span>
                </div>
            )}
        </div>
    );
}