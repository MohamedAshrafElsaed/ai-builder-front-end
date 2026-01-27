"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Project, IndexingProgress, Issue } from "@/types";

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const api = useApiClient();
    const router = useRouter();
    const { addToast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "indexing" | "issues">("overview");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Tab Data States
    const [progress, setProgress] = useState<IndexingProgress | null>(null);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isLoadingIssues, setIsLoadingIssues] = useState(false);

    // Polling ref
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // Fetch Project on Mount
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await api.get<Project>(`/projects/${id}`);
                setProject(data);
            } catch (error) {
                console.error("Failed to load project:", error);
                addToast("Failed to load project details", "error");
            }
        };
        fetchProject();
    }, [id, api]);

    // Handle Tab Switching & Data Loading
    useEffect(() => {
        if (activeTab === "issues") {
            fetchIssues();
        }

        // Start polling if accessing indexing tab or if project is known to be indexing
        if (activeTab === "indexing" || (project?.status === "indexing")) {
            startPolling();
        } else {
            stopPolling();
        }

        return () => stopPolling();
    }, [activeTab, project?.status]);

    const fetchIssues = async () => {
        try {
            setIsLoadingIssues(true);
            const data = await api.get<Issue[]>(`/projects/${id}/issues`);
            setIssues(data);
        } catch (error) {
            console.error("Failed to fetch issues:", error);
            // addToast("Failed to load issues", "error"); // Optional: don't spam if just switching
        } finally {
            setIsLoadingIssues(false);
        }
    };

    const startPolling = () => {
        if (pollInterval.current) return;

        const poll = async () => {
            try {
                const data = await api.get<IndexingProgress>(`/projects/${id}/indexing-progress`);
                setProgress(data);

                // Update project status if it changes
                if (data.status === "complete" && project?.status !== "active") {
                    setProject(prev => prev ? { ...prev, status: "active" } : null);
                    stopPolling(); // Stop if complete
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        poll(); // Immediate call
        pollInterval.current = setInterval(poll, 3000);
    };

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await api.delete(`/projects/${id}`);
            addToast("Project deleted", "success");
            router.push("/app/projects");
        } catch (error) {
            addToast("Failed to delete project", "error");
            setIsDeleting(false);
        }
    };

    if (!project) return <ProjectSkeleton />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
                        <StatusBadge status={project.status} />
                    </div>
                    <p className="text-text-secondary mt-1">{project.repo_full_name}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        className="text-status-error hover:text-status-error hover:bg-status-error/10"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete
                    </Button>
                    <Button onClick={() => window.open(`https://github.com/${project.repo_full_name}`, "_blank")}>
                        Open in GitHub
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-subtle">
                <div className="flex gap-6 overflow-x-auto">
                    <Tab
                        label="Overview"
                        isActive={activeTab === "overview"}
                        onClick={() => setActiveTab("overview")}
                    />
                    <Tab
                        label="Indexing Progress"
                        isActive={activeTab === "indexing"}
                        onClick={() => setActiveTab("indexing")}
                    />
                    <Tab
                        label={`Issues ${issues.length > 0 ? `(${issues.length})` : ""}`}
                        isActive={activeTab === "issues"}
                        onClick={() => setActiveTab("issues")}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === "overview" && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <h3 className="text-lg font-semibold mb-4">About this Project</h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                    <div>
                                        <dt className="text-sm text-text-secondary">Framework</dt>
                                        <dd className="font-medium">{project.laravel_version || "Detecting..."}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-text-secondary">Files Indexed</dt>
                                        <dd className="font-medium">{project.files_processed} / {project.total_files}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-text-secondary">Last Updated</dt>
                                        <dd className="font-medium">{new Date(project.updated_at).toLocaleString()}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-text-secondary">Health Score</dt>
                                        <dd className={`font-medium ${(project.health_score || 0) > 80 ? "text-status-success" : "text-status-warning"
                                            }`}>
                                            {project.health_score ? `${project.health_score}%` : "N/A"}
                                        </dd>
                                    </div>
                                </dl>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === "indexing" && (
                    <Card className="space-y-6">
                        <h3 className="text-lg font-semibold">Indexing Status</h3>
                        {progress ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-text-primary capitalize">{progress.status}</p>
                                        <p className="text-xs text-text-secondary">{progress.message || "Processing..."}</p>
                                    </div>
                                    <span className="text-xl font-bold">{Math.round(progress.progress_percentage)}%</span>
                                </div>

                                <ProgressBar
                                    progress={progress.progress_percentage}
                                    color={progress.status === "error" ? "warning" : "primary"}
                                />

                                <div className="text-xs font-mono bg-bg-elevated p-3 rounded-md border border-border-default">
                                    {progress.current_file ? `> Scanning: ${progress.current_file}` : "> Waiting for worker..."}
                                </div>
                            </div>
                        ) : (
                            <div className="text-text-secondary py-8 flex justify-center">Loading progress...</div>
                        )}
                    </Card>
                )}

                {activeTab === "issues" && (
                    <div className="space-y-4">
                        {isLoadingIssues ? (
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
                        ) : issues.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary bg-bg-surface border border-dashed border-border-default rounded-lg">
                                No issues found! Great job.
                            </div>
                        ) : (
                            issues.map(issue => (
                                <Card key={issue.id} className="border-l-4" style={{
                                    borderLeftColor: issue.severity === 'critical' ? 'var(--status-error)' :
                                        issue.severity === 'high' ? 'var(--status-warning)' : 'var(--border-default)'
                                }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-text-primary">{issue.title}</h4>
                                                <Badge variant={issue.severity === 'critical' ? 'error' : 'default'}>
                                                    {issue.severity}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-text-secondary mb-3">{issue.description}</p>
                                            <div className="text-xs font-mono bg-bg-elevated/50 p-1.5 rounded inline-block">
                                                {issue.file_path}:{issue.line_number}
                                            </div>
                                        </div>
                                        {issue.auto_fixable && (
                                            <Button size="sm" variant="secondary">Fix</Button>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Project"
                message="Are you sure? This will remove all indexed data and cannot be undone."
                isDestructive
                isLoading={isDeleting}
            />
        </div>
    );
}

function Tab({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                    ? "border-accent-primary text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
        >
            {label}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, "success" | "warning" | "error" | "default"> = {
        active: "success",
        indexing: "warning",
        error: "error",
        pending: "default"
    };
    return (
        <Badge variant={variants[status] || "default"}>
            {status === 'active' ? 'Ready' : status}
        </Badge>
    );
}

function ProjectSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex gap-6 border-b border-border-subtle pb-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
