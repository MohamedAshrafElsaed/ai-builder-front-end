import React from "react";
import { LoaderIcon } from "./Icons";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

export function Button({
                           className = "",
                           variant = "primary",
                           size = "md",
                           isLoading = false,
                           children,
                           ...props
                       }: ButtonProps) {
    const baseStyles = `
        inline-flex items-center justify-center gap-2 
        font-medium transition-all duration-200 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base
        disabled:opacity-50 disabled:pointer-events-none
        active:scale-[0.98]
    `;

    const variants = {
        primary: `
            bg-gradient-to-r from-accent-primary to-accent-secondary 
            text-white shadow-sm
            hover:shadow-lg hover:shadow-accent-primary/25
            focus-visible:ring-accent-primary
        `,
        secondary: `
            bg-bg-elevated text-text-primary 
            border border-border-default shadow-sm
            hover:bg-bg-hover hover:border-border-strong
            focus-visible:ring-border-strong
        `,
        ghost: `
            text-text-secondary 
            hover:text-text-primary hover:bg-bg-elevated
            focus-visible:ring-border-default
        `,
        danger: `
            bg-status-error/10 text-status-error 
            border border-status-error/20
            hover:bg-status-error/20 hover:border-status-error/30
            focus-visible:ring-status-error
        `,
    };

    const sizes = {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-lg",
        icon: "h-10 w-10 rounded-lg",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <LoaderIcon className="h-4 w-4 animate-spin" />
            )}
            {children}
        </button>
    );
}