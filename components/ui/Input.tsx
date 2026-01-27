import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`flex h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-status-error focus:border-status-error focus:ring-status-error/20" : ""
                        } ${className}`}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-status-error">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";
