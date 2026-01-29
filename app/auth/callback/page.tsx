"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth";

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [processed, setProcessed] = useState(false);

    useEffect(() => {
        // Prevent double processing
        if (processed) return;

        const token = searchParams.get("token");
        const errorParam = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");

        console.log("[AUTH CALLBACK] Params:", {
            hasToken: !!token,
            tokenLength: token?.length,
            error: errorParam
        });

        if (errorParam) {
            setError(errorDesc || errorParam);
            return;
        }

        if (!token) {
            setError("No authentication token received. Please try logging in again.");
            return;
        }

        // Mark as processed before async operations
        setProcessed(true);

        // Store the token
        authService.setToken(token);
        console.log("[AUTH CALLBACK] Token stored, redirecting to /app");

        // Small delay to ensure cookie is set before navigation
        setTimeout(() => {
            window.location.href = "/app";
        }, 100);
    }, [searchParams, processed, router]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-base">
                <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
                    <div className="h-12 w-12 rounded-full bg-status-error/10 flex items-center justify-center">
                        <svg className="h-6 w-6 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-text-primary font-medium">Authentication Failed</p>
                    <p className="text-text-secondary text-sm">{error}</p>
                    <button
                        onClick={() => window.location.href = "/auth"}
                        className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-hover text-sm"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-bg-base">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
                <p className="text-text-secondary">Completing authentication...</p>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="flex h-screen items-center justify-center bg-bg-base">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
                <p className="text-text-secondary">Loading...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CallbackHandler />
        </Suspense>
    );
}