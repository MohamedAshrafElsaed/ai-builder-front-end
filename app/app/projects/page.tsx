"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/Modal";
import { useApiClient } from "@/hooks/useApiClient";
import { useToast } from "@/components/ui/Toast";
import { Project } from "@/types";

export default function ProjectsPage() {
    const api = useApiClient();
    const { addToast } = useToast();

    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<Project[]>("/projects");
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            addToast("Failed to load projects", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [api]); // Re-fetch when api client (auth) is ready

    const handleDelete = async () => {
        if (!projectToDelete) return;

        try {
            setIsDeleting(true);
            await api.delete(`/projects/${projectToDelete.id}`);
            setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
            addToast("Project deleted successfully", "success");
            setProjectToDelete(null);
        } catch (error) {
            console.error("Failed to delete project:", error);
            addToast("Failed to delete project", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <ProjectsSkeleton />;
    }

    if (projects.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
                    <p className="text-text-secondary">Manage your connected repositories.</p>
                </div>
                <Link href="/app/projects/new">
                    <Button>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </Link>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block">
                <Card noPadding className="overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-bg-elevated border-b border-border-subtle">
                            <tr>
                                <th className="px-6 py-3 font-medium text-text-secondary">Project Name</th>
                                <th className="px-6 py-3 font-medium text-text-secondary">Repository</th>
                                <th className="px-6 py-3 font-medium text-text-secondary">Status</th>
                                <th className="px-6 py-3 font-medium text-text-secondary">Framework</th>
                                <th className="px-6 py-3 font-medium text-text-secondary">Last Updated</th>
                                <th className="px-6 py-3 font-medium text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {projects.map((project) => (
                                <tr key={project.id} className="hover:bg-bg-elevated/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-text-primary">
                                        <Link href={`/app/projects/${project.id}`} className="hover:underline">
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary font-mono text-xs">{project.repo_full_name}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={project.status} />
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary">{project.laravel_version || "Unknown"}</td>
                                    <td className="px-6 py-4 text-text-secondary">
                                        {new Date(project.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/app/projects/${project.id}`}>
                                                <Button variant="ghost" size="sm">Open</Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-status-error hover:text-status-error hover:bg-status-error/10"
                                                onClick={() => setProjectToDelete(project)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 lg:hidden">
                {projects.map((project) => (
                    <Card key={project.id} className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <Link href={`/app/projects/${project.id}`}>
                                    <h3 className="font-medium text-text-primary hover:text-accent-primary transition-colors">{project.name}</h3>
                                </Link>
                                <p className="text-xs text-text-secondary font-mono mt-1">{project.repo_full_name}</p>
                            </div>
                            <StatusBadge status={project.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
                            <div>
                                <span className="block text-xs text-text-muted">Framework</span>
                                {project.laravel_version || "Unknown"}
                            </div>
                            <div>
                                <span className="block text-xs text-text-muted">Updated</span>
                                {new Date(project.updated_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border-subtle flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-status-error"
                                onClick={() => setProjectToDelete(project)}
                            >
                                Delete
                            </Button>
                            <Link href={`/app/projects/${project.id}`}>
                                <Button variant="secondary" size="sm">Open Project</Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>

            <ConfirmModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Project"
                message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                isDestructive
                isLoading={isDeleting}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, "success" | "warning" | "error" | "default"> = {
        active: "success",
        indexing: "warning",
        error: "error",
        pending: "default"
    };

    const labels: Record<string, string> = {
        active: "Ready",
        indexing: "Indexing",
        error: "Error",
        pending: "Pending"
    };

    return (
        <Badge variant={variants[status] || "default"}>
            {labels[status] || status}
        </Badge>
    );
}

function EmptyState() {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border-default bg-bg-surface p-8 text-center animate-in fade-in zoom-in-95">
            <div className="mb-4 rounded-full bg-bg-elevated p-4">
                <FolderIcon className="h-8 w-8 text-text-secondary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">No projects yet</h3>
            <p className="mb-6 max-w-sm text-text-secondary">
                Connect a GitHub repository to verify your Laravel architecture and start building with AI.
            </p>
            <Link href="/app/projects/new">
                <Button>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create First Project
                </Button>
            </Link>
        </div>
    );
}

function ProjectsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
