import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

export function Card({ className = "", noPadding = false, children, ...props }: CardProps) {
    return (
        <div
            className={`bg-bg-base border border-border-subtle rounded-lg shadow-sm ${noPadding ? "" : "p-6"
                } ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
