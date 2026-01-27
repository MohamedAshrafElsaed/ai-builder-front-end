"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
    name: string;
    email: string;
    avatar_url: string;
}

interface AppContextType {
    // Sidebar state
    isSidebarOpen: boolean;
    toggleSidebar: () => void;

    // Mobile drawer state
    isDrawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;

    // Auth state (mock)
    isAuthenticated: boolean;
    user: User | null;
    login: () => void;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    // Desktop sidebar state - persisted
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Mobile drawer state - ephemeral
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Mock auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    // Initialize from localStorage
    useEffect(() => {
        const savedSidebarState = localStorage.getItem("sidebar-state");
        if (savedSidebarState !== null) {
            setIsSidebarOpen(savedSidebarState === "true");
        }

        // Check for mock auth session
        const savedAuth = localStorage.getItem("mock-auth");
        if (savedAuth === "true") {
            setIsAuthenticated(true);
            setUser({
                name: "Demo User",
                email: "demo@laravel.ai",
                avatar_url: "https://github.com/shadcn.png"
            });
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem("sidebar-state", String(newState));
    };

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    const login = () => {
        setIsAuthenticated(true);
        setUser({
            name: "Demo User",
            email: "demo@laravel.ai",
            avatar_url: "https://github.com/shadcn.png"
        });
        localStorage.setItem("mock-auth", "true");
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem("mock-auth");
    };

    return (
        <AppContext.Provider
            value={{
                isSidebarOpen,
                toggleSidebar,
                isDrawerOpen,
                openDrawer,
                closeDrawer,
                isAuthenticated,
                user,
                login,
                logout,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
}
