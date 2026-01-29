// components/layout/Sidebar.tsx - Updated with UI Designer link
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEffect } from "react";

const NAV_ITEMS = [
    { label: "Overview", href: "/app", icon: HomeIcon },
    { label: "Projects", href: "/app/projects", icon: FolderIcon },
    { label: "UI Designer", href: "/app/ui-designer", icon: PaletteIcon, badge: "AI" },
    { label: "Chat", href: "/app/chat", icon: ChatIcon },
    { label: "Settings", href: "/app/settings", icon: CogIcon },
    { label: "Billing", href: "/app/billing", icon: CreditCardIcon },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isSidebarOpen, isDrawerOpen, closeDrawer } = useApp();
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    useEffect(() => {
        closeDrawer();
    }, [pathname]);

    if (isDesktop) {
        return (
            <aside
                className={`fixed left-0 top-14 bottom-0 z-30 flex flex-col border-r border-border-subtle bg-bg-base transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-16"
                }`}
            >
                <NavContent collapsed={!isSidebarOpen} />
            </aside>
        );
    }

    return (
        <>
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={closeDrawer}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-base shadow-xl transition-transform duration-300 ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-14 items-center border-b border-border-subtle px-6">
                    <span className="font-semibold text-text-primary">Laravel AI</span>
                </div>
                <NavContent collapsed={false} />
            </aside>
        </>
    );
}

function NavContent({ collapsed }: { collapsed: boolean }) {
    const pathname = usePathname();

    return (
        <nav className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                            ? "bg-accent-primary/10 text-accent-primary"
                            : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                        }`}
                    >
                        <item.icon
                            className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-accent-primary" : "text-text-secondary group-hover:text-text-primary"
                            }`}
                        />
                        {!collapsed && (
                            <span className="ml-3 flex-1 flex items-center justify-between">
                                {item.label}
                                {item.badge && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent-primary/20 text-accent-primary">
                                        {item.badge}
                                    </span>
                                )}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

// Icons
function HomeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function FolderIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    );
}

function PaletteIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
    );
}

function ChatIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    );
}

function CogIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function CreditCardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    );
}