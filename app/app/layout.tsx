"use client";

import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppProvider>
            <ToastProvider>
                <AppShell>{children}</AppShell>
            </ToastProvider>
        </AppProvider>
    );
}
