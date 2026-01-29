import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
    variant?: "default" | "elevated" | "bordered";
}

export function Card(
    {
        className = "",
        noPadding = false,
        variant = "default",
        children,
        ...props
    }: CardProps) {
    const baseStyles = "rounded-xl transition-all duration-200";

    const variants = {
        default: `
            bg-bg-surface border border-border-subtle 
            shadow-sm
        `,
        elevated: `
            bg-bg-elevated border border-border-default 
            shadow-md
        `,
        bordered: `
            bg-bg-surface border-2 border-border-default
        `,
    };

    const padding = noPadding ? "" : "p-5";

    return (
        <div
            className={`${baseStyles} ${variants[variant]} ${padding} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}