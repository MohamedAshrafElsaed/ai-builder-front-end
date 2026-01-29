"use client";

import { useMemo, useState } from 'react';
import { GeneratedFile } from '@/types/ui-designer';
import {
    FolderIcon, FolderOpenIcon, FileCodeIcon, FileIcon,
    ChevronRightIcon, ReactIcon, VueIcon, CssIcon, LayersIcon
} from '@/components/ui/Icons';

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

function getFileIcon(language: string, className: string = "w-4 h-4") {
    switch (language) {
        case 'tsx':
        case 'jsx':
            return <ReactIcon className={`${className} text-[#61DAFB]`} />;
        case 'vue':
            return <VueIcon className={`${className} text-[#42B883]`} />;
        case 'css':
        case 'scss':
            return <CssIcon className={`${className} text-[#264de4]`} />;
        case 'ts':
        case 'js':
            return <FileCodeIcon className={`${className} text-status-warning`} />;
        default:
            return <FileIcon className={`${className} text-text-muted`} />;
    }
}

export function FileTree({
                             files,
                             selectedIndex,
                             onSelect,
                             selectedForApply,
                             onToggleApply,
                         }: FileTreeProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center">
                        <LayersIcon className="w-8 h-8 text-text-muted" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">No Files Yet</h3>
                    <p className="text-sm text-text-muted">Generated files will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto p-4 scrollbar-thin">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Generated Files</h3>
                <span className="text-xs text-text-muted">
                    {selectedForApply.size}/{files.length}
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
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-bg-elevated transition-colors group"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    <ChevronRightIcon
                        className={`w-3 h-3 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    {isExpanded ? (
                        <FolderOpenIcon className="w-4 h-4 text-accent-primary" />
                    ) : (
                        <FolderIcon className="w-4 h-4 text-text-secondary group-hover:text-accent-primary" />
                    )}
                    <span className="text-sm text-text-primary truncate">{node.name}</span>
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
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                isSelected
                    ? 'bg-accent-primary/10 border border-accent-primary/30'
                    : 'hover:bg-bg-elevated border border-transparent'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => node.fileIndex !== undefined && onSelect(node.fileIndex)}
        >
            <label className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => node.file && onToggleApply(node.file.path)}
                    className="w-4 h-4 rounded cursor-pointer"
                />
            </label>

            {node.file && getFileIcon(node.file.language)}

            <span className={`text-sm truncate flex-1 ${isSelected ? 'text-accent-primary font-medium' : 'text-text-primary'}`}>
                {node.name}
            </span>

            {node.file && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-text-muted">{node.file.line_count}L</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        node.file.type === 'component'
                            ? 'bg-accent-primary/10 text-accent-primary'
                            : node.file.type === 'style'
                                ? 'bg-status-info/10 text-status-info'
                                : node.file.type === 'test'
                                    ? 'bg-status-success/10 text-status-success'
                                    : 'bg-bg-elevated text-text-muted'
                    }`}>
                        {node.file.type}
                    </span>
                </div>
            )}
        </div>
    );
}