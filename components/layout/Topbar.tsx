"use client";

import { useApp } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";
import { authService, User } from "@/lib/auth";
import { apiClient } from "@/lib/apiClient";
import { useEffect, useState } from "react";

interface MeResponse {
    user: User;
    personal_team?: {
        id: string;
        name: string;
        slug: string;
        is_personal: boolean;
    };
}

export function Topbar() {
    const { toggleSidebar, openDrawer } = useApp();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const loadUser = async () => {
            // First check if we have cached user
            const cachedUser = authService.getUser();
            if (cachedUser) {
                setUser(cachedUser);
                setIsLoading(false);
                return;
            }

            // If authenticated but no user cached, fetch from API
            if (authService.isAuthenticated()) {
                try {
                    const response = await apiClient.get<MeResponse>("/auth/me");
                    if (response.user) {
                        authService.setUser(response.user);
                        setUser(response.user);
                    }
                } catch (error) {
                    console.error("[TOPBAR] Failed to fetch user:", error);
                    // Token might be invalid
                    authService.logout();
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    // Simple breadcrumb logic
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumb = segments.length > 1 ? segments[segments.length - 1] : "Overview";
    const formattedTitle = breadcrumb.charAt(0).toUpperCase() + breadcrumb.slice(1);

    return (
        <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-bg-base/80 px-4 backdrop-blur-md lg:px-8">
            <div className="flex items-center gap-4">
                {/* Mobile Hamburger */}
                <button
                    onClick={openDrawer}
                    className="rounded-md p-1 text-text-secondary hover:bg-bg-elevated hover:text-text-primary lg:hidden"
                >
                    <MenuIcon className="h-6 w-6" />
                </button>

                {/* Desktop Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="hidden rounded-md p-1 text-text-secondary hover:bg-bg-elevated hover:text-text-primary lg:block"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>

                {/* Breadcrumb / Title */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-text-primary">{formattedTitle}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {isLoading ? (
                    <div className="h-8 w-8 rounded-full bg-bg-elevated animate-pulse" />
                ) : user ? (
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-text-secondary sm:inline-block">
                            {user.username || user.name}
                        </span>
                        <div className="h-8 w-8 overflow-hidden rounded-full border border-border-default bg-bg-elevated">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username || "User"} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-accent-primary/10 text-xs font-medium text-accent-primary">
                                    {(user.username || user.name || "U").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-text-secondary hover:text-status-error"
                            onClick={() => authService.logout()}
                        >
                            Log out
                        </Button>
                    </div>
                ) : null}
            </div>
        </header>
    );
}

function MenuIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}