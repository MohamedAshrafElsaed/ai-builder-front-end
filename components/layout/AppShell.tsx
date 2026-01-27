"use client";

import { useApp } from "@/context/AppContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen } = useApp();

    return (
        <div className="min-h-screen bg-bg-base text-text-primary">
            <Sidebar />
            <Topbar />

            <main
                className={`transition-all duration-300 ${isSidebarOpen ? "lg:pl-64" : "lg:pl-16"
                    }`}
            >
                <div className="container mx-auto max-w-7xl p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
