import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "success" | "warning" | "error" | "info" | "outline" | "accent";
}

export function Badge({
                          className = "",
                          variant = "default",
                          children,
                          ...props
                      }: BadgeProps) {
    const baseStyles = `
        inline-flex items-center gap-1.5 
        rounded-full px-2.5 py-0.5 
        text-xs font-medium
        transition-colors
    `;

    const variants = {
        default: `
            bg-bg-elevated text-text-secondary 
            border border-border-subtle
        `,
        success: `
            bg-status-success/10 text-status-success 
            border border-status-success/20
        `,
        warning: `
            bg-status-warning/10 text-status-warning 
            border border-status-warning/20
        `,
        error: `
            bg-status-error/10 text-status-error 
            border border-status-error/20
        `,
        info: `
            bg-status-info/10 text-status-info 
            border border-status-info/20
        `,
        outline: `
            text-text-secondary 
            border border-border-default
        `,
        accent: `
            bg-accent-primary/10 text-accent-primary 
            border border-accent-primary/20
        `,
    };

    return (
        <span
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}