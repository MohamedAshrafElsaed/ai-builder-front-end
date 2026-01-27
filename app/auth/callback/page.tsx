"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService, AuthSession } from "@/lib/auth";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addToast } = useToast();
    const processedRef = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code) {
            router.replace("/auth");
            return;
        }

        if (processedRef.current) return;
        processedRef.current = true;

        const exchangeCode = async () => {
            try {
                // Exchange code for token
                const response = await apiClient.get<AuthSession>("/auth/github/callback", {
                    query: { code }
                });

                authService.setSession(response);
                addToast("Successfully logged in", "success");
                router.push("/app");
            } catch (error: any) {
                console.error("Auth Exchange Error:", error);
                addToast(error.message || "Failed to complete authentication", "error");
                // Optionally show request_id if available
                if (error.request_id) {
                    console.log("Request ID:", error.request_id);
                }
                router.push("/auth");
            }
        };

        exchangeCode();
    }, [searchParams, router, addToast]);

    return (
        <div className="flex h-screen items-center justify-center bg-bg-base">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
                <p className="text-text-secondary">Authenticating...</p>
            </div>
        </div>
    );
}
