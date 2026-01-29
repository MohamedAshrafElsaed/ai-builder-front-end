"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useApiClient } from "@/hooks/useApiClient";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Project } from "@/types";

// Chat Components
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { CodePanel } from "@/components/chat/CodePanel";
import { AgentStatus } from "@/components/chat/AgentStatus";
import { PlanApproval } from "@/components/chat/PlanApproval";

// ============================================================================
// Main Page with Suspense
// ============================================================================

export default function ChatPage() {
    return (
        <Suspense fallback={<ChatPageSkeleton />}>
            <ChatPageContent />
        </Suspense>
    );
}

// ============================================================================
// Chat Page Content
// ============================================================================

function ChatPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const api = useApiClient();
    const { addToast } = useToast();
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    // Project state
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        searchParams.get("project") || null
    );
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);

    // UI state
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [codePanelOpen, setCodePanelOpen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

    // Load projects on mount
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setIsLoadingProjects(true);
            setProjectsError(null);
            const data = await api.get<Project[]>("/projects");
            const readyProjects = data.filter((p) => p.status === "ready");
            setProjects(readyProjects);

            // Auto-select first project if none selected
            if (!selectedProjectId && readyProjects.length > 0) {
                setSelectedProjectId(readyProjects[0].id);
            }
        } catch (err: any) {
            console.error("Failed to load projects:", err);
            setProjectsError(err.message || "Failed to load projects");
            addToast("Failed to load projects", "error");
        } finally {
            setIsLoadingProjects(false);
        }
    };

    // Update URL when project changes
    useEffect(() => {
        if (selectedProjectId) {
            router.replace(`/app/chat?project=${selectedProjectId}`, { scroll: false });
        }
    }, [selectedProjectId, router]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K: Focus input
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                document.getElementById("chat-input")?.focus();
            }
            // Cmd/Ctrl + B: Toggle sidebar
            if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                e.preventDefault();
                setSidebarOpen((prev) => !prev);
            }
            // Cmd/Ctrl + ]: Toggle code panel
            if ((e.metaKey || e.ctrlKey) && e.key === "]") {
                e.preventDefault();
                setCodePanelOpen((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Handle project change
    const handleProjectChange = useCallback((projectId: string) => {
        setSelectedProjectId(projectId);
        setMobileSidebarOpen(false);
    }, []);

    // Handle delete conversation request
    const handleDeleteRequest = useCallback((conversationId: string) => {
        setConversationToDelete(conversationId);
        setDeleteModalOpen(true);
    }, []);

    // Loading state
    if (isLoadingProjects) {
        return <ChatPageSkeleton />;
    }

    // Error state
    if (projectsError) {
        return (
            <ErrorState
                message={projectsError}
                onRetry={loadProjects}
            />
        );
    }

    // No projects state
    if (projects.length === 0) {
        return <NoProjectsState />;
    }

    // No project selected - show project selector
    if (!selectedProjectId) {
        return (
            <ProjectSelector
                projects={projects}
                onSelect={handleProjectChange}
            />
        );
    }

    const currentProject = projects.find((p) => p.id === selectedProjectId);

    return (
        <ChatLayout
            projectId={selectedProjectId}
            projects={projects}
            currentProject={currentProject}
            isDesktop={isDesktop}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            codePanelOpen={codePanelOpen}
            setCodePanelOpen={setCodePanelOpen}
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
            onProjectChange={handleProjectChange}
            onDeleteRequest={handleDeleteRequest}
            deleteModalOpen={deleteModalOpen}
            setDeleteModalOpen={setDeleteModalOpen}
            conversationToDelete={conversationToDelete}
            setConversationToDelete={setConversationToDelete}
        />
    );
}

// ============================================================================
// Chat Layout
// ============================================================================

interface ChatLayoutProps {
    projectId: string;
    projects: Project[];
    currentProject: Project | undefined;
    isDesktop: boolean;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    codePanelOpen: boolean;
    setCodePanelOpen: (open: boolean) => void;
    mobileSidebarOpen: boolean;
    setMobileSidebarOpen: (open: boolean) => void;
    onProjectChange: (id: string) => void;
    onDeleteRequest: (id: string) => void;
    deleteModalOpen: boolean;
    setDeleteModalOpen: (open: boolean) => void;
    conversationToDelete: string | null;
    setConversationToDelete: (id: string | null) => void;
}

function ChatLayout({
                        projectId,
                        projects,
                        currentProject,
                        isDesktop,
                        sidebarOpen,
                        setSidebarOpen,
                        codePanelOpen,
                        setCodePanelOpen,
                        mobileSidebarOpen,
                        setMobileSidebarOpen,
                        onProjectChange,
                        onDeleteRequest,
                        deleteModalOpen,
                        setDeleteModalOpen,
                        conversationToDelete,
                        setConversationToDelete,
                    }: ChatLayoutProps) {
    const chat = useChat(projectId);

    // Handle delete conversation
    const handleDeleteConversation = async () => {
        if (conversationToDelete) {
            await chat.deleteConversation(conversationToDelete);
            setDeleteModalOpen(false);
            setConversationToDelete(null);
        }
    };

    // Auto-open code panel when there are code changes
    useEffect(() => {
        if (chat.hasCodeChanges && isDesktop) {
            setCodePanelOpen(true);
        }
    }, [chat.hasCodeChanges, isDesktop, setCodePanelOpen]);

    // Mobile Layout
    if (!isDesktop) {
        return (
            <MobileLayout
                chat={chat}
                projects={projects}
                currentProject={currentProject}
                mobileSidebarOpen={mobileSidebarOpen}
                setMobileSidebarOpen={setMobileSidebarOpen}
                onProjectChange={onProjectChange}
                onDeleteRequest={onDeleteRequest}
                deleteModalOpen={deleteModalOpen}
                setDeleteModalOpen={setDeleteModalOpen}
                onDeleteConfirm={handleDeleteConversation}
            />
        );
    }

    // Desktop Layout
    return (
        <DesktopLayout
            chat={chat}
            projects={projects}
            currentProject={currentProject}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            codePanelOpen={codePanelOpen}
            setCodePanelOpen={setCodePanelOpen}
            onProjectChange={onProjectChange}
            onDeleteRequest={onDeleteRequest}
            deleteModalOpen={deleteModalOpen}
            setDeleteModalOpen={setDeleteModalOpen}
            onDeleteConfirm={handleDeleteConversation}
        />
    );
}

// ============================================================================
// Desktop Layout
// ============================================================================

interface DesktopLayoutProps {
    chat: ReturnType<typeof useChat>;
    projects: Project[];
    currentProject: Project | undefined;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    codePanelOpen: boolean;
    setCodePanelOpen: (open: boolean) => void;
    onProjectChange: (id: string) => void;
    onDeleteRequest: (id: string) => void;
    deleteModalOpen: boolean;
    setDeleteModalOpen: (open: boolean) => void;
    onDeleteConfirm: () => void;
}

function DesktopLayout({
                           chat,
                           projects,
                           currentProject,
                           sidebarOpen,
                           setSidebarOpen,
                           codePanelOpen,
                           setCodePanelOpen,
                           onProjectChange,
                           onDeleteRequest,
                           deleteModalOpen,
                           setDeleteModalOpen,
                           onDeleteConfirm,
                       }: DesktopLayoutProps) {
    return (
        <div className="flex h-[calc(100vh-7rem)] overflow-hidden">
            {/* Sidebar */}
            <div
                className={`flex-shrink-0 border-r border-border-subtle bg-bg-base transition-all duration-300 ${
                    sidebarOpen ? "w-72" : "w-0"
                } overflow-hidden`}
            >
                <ChatSidebar
                    chat={chat}
                    projects={projects}
                    currentProjectId={currentProject?.id || ""}
                    onProjectChange={onProjectChange}
                    onDeleteRequest={onDeleteRequest}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-bg-base">
                {/* Header */}
                <ChatHeader
                    chat={chat}
                    projectName={currentProject?.name || ""}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    codePanelOpen={codePanelOpen}
                    onToggleCodePanel={() => setCodePanelOpen(!codePanelOpen)}
                />

                {/* Messages */}
                <ChatMessages chat={chat} />

                {/* Agent Status / Thinking Indicator */}
                {chat.isProcessing && (
                    <AgentStatus
                        status={chat.status}
                        currentThought={chat.currentThought}
                        activeAgent={chat.activeAgent}
                        currentPlan={chat.currentPlan}
                        currentStepIndex={chat.currentStepIndex}
                    />
                )}

                {/* Plan Approval */}
                {chat.isAwaitingApproval && chat.currentPlan && (
                    <PlanApproval
                        plan={chat.currentPlan}
                        onApprove={() => chat.approvePlan(true)}
                        onReject={() => chat.approvePlan(false)}
                    />
                )}

                {/* Input Area */}
                <ChatInput
                    chat={chat}
                    inputId="chat-input"
                />
            </div>

            {/* Code Panel */}
            <div
                className={`flex-shrink-0 border-l border-border-subtle bg-bg-surface transition-all duration-300 ${
                    codePanelOpen && chat.hasCodeChanges ? "w-96" : "w-0"
                } overflow-hidden`}
            >
                <CodePanel chat={chat} />
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={onDeleteConfirm}
                title="Delete Conversation"
                message="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}

// ============================================================================
// Mobile Layout
// ============================================================================

interface MobileLayoutProps {
    chat: ReturnType<typeof useChat>;
    projects: Project[];
    currentProject: Project | undefined;
    mobileSidebarOpen: boolean;
    setMobileSidebarOpen: (open: boolean) => void;
    onProjectChange: (id: string) => void;
    onDeleteRequest: (id: string) => void;
    deleteModalOpen: boolean;
    setDeleteModalOpen: (open: boolean) => void;
    onDeleteConfirm: () => void;
}

function MobileLayout({
                          chat,
                          projects,
                          currentProject,
                          mobileSidebarOpen,
                          setMobileSidebarOpen,
                          onProjectChange,
                          onDeleteRequest,
                          deleteModalOpen,
                          setDeleteModalOpen,
                          onDeleteConfirm,
                      }: MobileLayoutProps) {
    return (
        <div className="flex flex-col h-[calc(100vh-7rem)]">
            {/* Mobile Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface">
                <div className="flex items-center gap-3">
                    {chat.conversationId ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => chat.startNewConversation()}
                            aria-label="Back"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileSidebarOpen(true)}
                            aria-label="Menu"
                        >
                            <MenuIcon className="h-5 w-5" />
                        </Button>
                    )}
                    <div className="truncate">
                        <p className="text-sm font-semibold text-text-primary truncate">
                            {chat.conversationId
                                ? chat.conversations.find((c) => c.id === chat.conversationId)?.title || "Chat"
                                : "New Chat"}
                        </p>
                        <p className="text-xs text-text-muted">{currentProject?.name}</p>
                    </div>
                </div>
                <Button size="sm" variant="ghost" onClick={chat.startNewConversation} aria-label="New chat">
                    <PlusIcon className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages */}
            <ChatMessages chat={chat} />

            {/* Agent Status */}
            {chat.isProcessing && (
                <AgentStatus
                    status={chat.status}
                    currentThought={chat.currentThought}
                    activeAgent={chat.activeAgent}
                    currentPlan={chat.currentPlan}
                    currentStepIndex={chat.currentStepIndex}
                />
            )}

            {/* Plan Approval */}
            {chat.isAwaitingApproval && chat.currentPlan && (
                <PlanApproval
                    plan={chat.currentPlan}
                    onApprove={() => chat.approvePlan(true)}
                    onReject={() => chat.approvePlan(false)}
                />
            )}

            {/* Input */}
            <ChatInput chat={chat} inputId="chat-input-mobile" />

            {/* Mobile Sidebar Drawer */}
            {mobileSidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-bg-base shadow-xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                            <h2 className="font-semibold text-text-primary">Conversations</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileSidebarOpen(false)}
                                aria-label="Close"
                            >
                                <XIcon className="h-5 w-5" />
                            </Button>
                        </div>
                        <ChatSidebar
                            chat={chat}
                            projects={projects}
                            currentProjectId={currentProject?.id || ""}
                            onProjectChange={(id) => {
                                onProjectChange(id);
                                setMobileSidebarOpen(false);
                            }}
                            onDeleteRequest={onDeleteRequest}
                        />
                    </div>
                </>
            )}

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={onDeleteConfirm}
                title="Delete Conversation"
                message="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}

// ============================================================================
// State Components
// ============================================================================

function ChatPageSkeleton() {
    return (
        <div className="flex h-[calc(100vh-7rem)] gap-0">
            {/* Sidebar Skeleton */}
            <div className="w-72 border-r border-border-subtle p-4 space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="pt-4 space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Main Area Skeleton */}
            <div className="flex-1 flex flex-col">
                <div className="h-14 border-b border-border-subtle px-4 flex items-center">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
                        <Skeleton className="h-6 w-48 rounded mx-auto" />
                        <Skeleton className="h-4 w-64 rounded mx-auto" />
                    </div>
                </div>
                <div className="p-4 border-t border-border-subtle">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
            <div className="w-16 h-16 rounded-2xl bg-status-error/10 flex items-center justify-center mb-4">
                <AlertCircleIcon className="h-8 w-8 text-status-error" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-sm text-text-secondary mb-6 text-center max-w-md">{message}</p>
            <Button onClick={onRetry}>Try Again</Button>
        </div>
    );
}

function NoProjectsState() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center mb-4">
                <FolderIcon className="h-8 w-8 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">No Projects Found</h2>
            <p className="text-sm text-text-secondary mb-6 text-center max-w-md">
                Create a project to start chatting with AI. Import a repository from GitHub to get started.
            </p>
            <Button onClick={() => router.push("/app/projects/new")}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Project
            </Button>
        </div>
    );
}

function ProjectSelector({
                             projects,
                             onSelect,
                         }: {
    projects: Project[];
    onSelect: (id: string) => void;
}) {
    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="h-8 w-8 text-accent-primary" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Select a Project</h1>
                <p className="text-text-secondary">Choose a project to start chatting with AI.</p>
            </div>

            <div className="grid gap-3">
                {projects.map((project) => (
                    <button
                        key={project.id}
                        onClick={() => onSelect(project.id)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-border-subtle hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-200 text-left group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center group-hover:bg-accent-primary/20 transition-colors">
                            <FolderIcon className="h-6 w-6 text-accent-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                                {project.name}
                            </p>
                            <p className="text-sm text-text-muted truncate">{project.repo_full_name}</p>
                        </div>
                        <Badge variant="default">{project.indexed_files_count} files</Badge>
                        <ChevronRightIcon className="h-5 w-5 text-text-muted group-hover:text-accent-primary transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function ChevronLeftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

function MenuIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function AlertCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}