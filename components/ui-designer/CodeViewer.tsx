"use client";

import { useRef, useEffect, useMemo } from 'react';

interface CodeViewerProps {
    code: string;
    language: string;
    isStreaming?: boolean;
}

// Simple syntax highlighting - in production, use Prism or Monaco
const SYNTAX_PATTERNS: Record<string, { pattern: RegExp; className: string }[]> = {
    tsx: [
        { pattern: /\/\/.*$/gm, className: 'text-zinc-600 italic' },
        { pattern: /\/\*[\s\S]*?\*\//g, className: 'text-zinc-600 italic' },
        { pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, className: 'text-green-400' },
        { pattern: /\b(import|export|from|default|const|let|var|function|return|if|else|for|while|class|extends|interface|type|enum|async|await|try|catch|throw|new|this|super|static|public|private|protected|readonly|typeof|instanceof|in|of)\b/g, className: 'text-purple-400' },
        { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: 'text-orange-400' },
        { pattern: /\b(\d+\.?\d*)\b/g, className: 'text-orange-400' },
        { pattern: /\b(React|useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)\b/g, className: 'text-cyan-400' },
        { pattern: /<\/?([A-Z][a-zA-Z0-9]*)/g, className: 'text-yellow-400' },
        { pattern: /\b([a-z_$][a-zA-Z0-9_$]*)\s*\(/g, className: 'text-blue-400' },
        { pattern: /(@[a-zA-Z]+)/g, className: 'text-pink-400' },
    ],
    vue: [
        { pattern: /<!--[\s\S]*?-->/g, className: 'text-zinc-600 italic' },
        { pattern: /<template>|<\/template>|<script.*?>|<\/script>|<style.*?>|<\/style>/g, className: 'text-pink-400' },
        { pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, className: 'text-green-400' },
        { pattern: /\b(import|export|from|default|const|let|var|function|return|if|else|for|while|ref|reactive|computed|watch|onMounted|defineComponent)\b/g, className: 'text-purple-400' },
    ],
    php: [
        { pattern: /\/\/.*$/gm, className: 'text-zinc-600 italic' },
        { pattern: /\/\*[\s\S]*?\*\//g, className: 'text-zinc-600 italic' },
        { pattern: /#.*$/gm, className: 'text-zinc-600 italic' },
        { pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, className: 'text-green-400' },
        { pattern: /\b(namespace|use|class|function|public|private|protected|static|return|if|else|foreach|for|while|new|extends|implements|trait|interface|abstract|final|throw|try|catch|finally)\b/g, className: 'text-purple-400' },
        { pattern: /\$[a-zA-Z_][a-zA-Z0-9_]*/g, className: 'text-red-400' },
        { pattern: /->/g, className: 'text-zinc-400' },
        { pattern: /::/g, className: 'text-zinc-400' },
    ],
    css: [
        { pattern: /\/\*[\s\S]*?\*\//g, className: 'text-zinc-600 italic' },
        { pattern: /([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g, className: 'text-yellow-400' },
        { pattern: /([a-z-]+)\s*:/g, className: 'text-cyan-400' },
        { pattern: /#[0-9a-fA-F]{3,8}/g, className: 'text-orange-400' },
        { pattern: /\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms)/g, className: 'text-orange-400' },
    ],
};

export function CodeViewer({ code = '', language, isStreaming = false }: CodeViewerProps) {
    const containerRef = useRef<HTMLPreElement>(null);
    const prevLengthRef = useRef(0);

    // Auto-scroll when streaming
    useEffect(() => {
        if (isStreaming && containerRef.current && code && code.length > prevLengthRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
        prevLengthRef.current = code?.length || 0;
    }, [code, isStreaming]);

    // Apply syntax highlighting
    const highlightedCode = useMemo(() => {
        if (!code) return '';

        const lang = language === 'ts' || language === 'js' || language === 'jsx' ? 'tsx' : language;
        const patterns = SYNTAX_PATTERNS[lang] || SYNTAX_PATTERNS.tsx;

        // Escape HTML first
        let escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Apply patterns with placeholder system to avoid re-matching
        const placeholders: string[] = [];

        patterns.forEach(({ pattern, className }) => {
            escaped = escaped.replace(pattern, (match) => {
                const index = placeholders.length;
                placeholders.push(`<span class="${className}">${match}</span>`);
                return `__PLACEHOLDER_${index}__`;
            });
        });

        // Restore placeholders
        placeholders.forEach((replacement, index) => {
            escaped = escaped.replace(`__PLACEHOLDER_${index}__`, replacement);
        });

        return escaped;
    }, [code, language]);

    // Line numbers
    const lines = code.split('\n');
    const lineNumbers = lines.map((_, i) => i + 1);

    if (!code) {
        return (
            <div className="h-full flex items-center justify-center text-zinc-600">
                {isStreaming ? 'Waiting for code...' : 'No code to display'}
            </div>
        );
    }

    return (
        <div className="h-full flex bg-[#0a0a0a] overflow-hidden">
            {/* Line Numbers */}
            <div className="flex-shrink-0 py-4 pr-4 pl-4 text-right select-none bg-[#0a0a0a] border-r border-[#1f1f1f]">
                {lineNumbers.map((num) => (
                    <div
                        key={num}
                        className="text-xs leading-6 text-zinc-700 font-mono"
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Code Content */}
            <pre
                ref={containerRef}
                className="flex-1 overflow-auto py-4 px-4 font-mono text-sm leading-6 text-zinc-300 scrollbar-thin"
            >
                <code
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
                {isStreaming && (
                    <span className="inline-block w-2 h-5 ml-0.5 bg-pink-500 animate-pulse" />
                )}
            </pre>
        </div>
    );
}

// Streaming code display with typing effect
interface StreamingCodeProps {
    code: string;
    language: string;
}

export function StreamingCode({ code, language }: StreamingCodeProps) {
    return (
        <div className="relative h-full">
            <CodeViewer code={code} language={language} isStreaming />

            {/* Streaming indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                <span className="text-xs text-pink-400">Streaming...</span>
            </div>
        </div>
    );
}