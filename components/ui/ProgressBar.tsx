import React from "react";

interface ProgressBarProps {
    progress: number; // 0 to 100
    label?: string;
    showValue?: boolean;
    color?: "primary" | "success" | "warning";
    className?: string;
}

export function ProgressBar({
    progress,
    label,
    showValue = false,
    color = "primary",
    className = ""
}: ProgressBarProps) {
    const colors = {
        primary: "bg-accent-primary",
        success: "bg-status-success",
        warning: "bg-status-warning",
    };

    return (
        <div className={`w-full ${className}`}>
            {(label || showValue) && (
                <div className="flex justify-between mb-1.5 text-xs">
                    {label && <span className="font-medium text-text-secondary">{label}</span>}
                    {showValue && <span className="text-text-primary">{Math.round(progress)}%</span>}
                </div>
            )}
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
                <div
                    className={`h-full transition-all duration-500 ease-out ${colors[color]}`}
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
            </div>
        </div>
    );
}
