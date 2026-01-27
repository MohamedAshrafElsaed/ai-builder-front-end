"use client";

import { useApp } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";
import { authService, AuthSession } from "@/lib/auth";
import { useEffect, useState } from "react";

export function Topbar() {
    const { toggleSidebar, openDrawer } = useApp();
    const [session, setSession] = useState<AuthSession | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Load session from local storage via AuthService
        setSession(authService.getSession());
    }, []);

    const user = session?.user;

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
                {user && (
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-text-secondary sm:inline-block">
                            {user.name}
                        </span>
                        <div className="h-8 w-8 overflow-hidden rounded-full border border-border-default bg-bg-elevated">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name || "User"} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-accent-primary/10 text-xs font-medium text-accent-primary">
                                    {user.name?.charAt(0) || "U"}
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
                )}
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
