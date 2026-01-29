"use client";

import { useCallback, useRef, useState } from 'react';

interface ResizableDividerProps {
    onResize: (delta: number) => void;
}

export function ResizableDivider({ onResize }: ResizableDividerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const lastXRef = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        lastXRef.current = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - lastXRef.current;
            lastXRef.current = moveEvent.clientX;
            onResize(delta);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [onResize]);

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`w-1 cursor-col-resize flex-shrink-0 group relative ${
                isDragging ? 'bg-pink-500' : 'bg-[#1f1f1f] hover:bg-[#333]'
            } transition-colors`}
        >
            {/* Visual indicator */}
            <div
                className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 flex items-center justify-center ${
                    isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}
            >
                <div className="flex flex-col gap-1">
                    <div className="w-1 h-1 rounded-full bg-zinc-500" />
                    <div className="w-1 h-1 rounded-full bg-zinc-500" />
                    <div className="w-1 h-1 rounded-full bg-zinc-500" />
                </div>
            </div>
        </div>
    );
}