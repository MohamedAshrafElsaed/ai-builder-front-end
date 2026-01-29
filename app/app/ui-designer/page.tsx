"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApiClient } from '@/hooks/useApiClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Project } from '@/types';

export default function UIDesignerProjectSelector() {
    const api = useApiClient();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.get<Project[]>('/projects');
                // Filter to only show active/ready projects
                setProjects(data.filter(p => p.status === 'ready'));
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [api]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-8 space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🎨</span>
                    <h1 className="text-2xl font-bold text-text-primary">UI Designer</h1>
                </div>
                <p className="text-text-secondary">
                    Select a project to start designing beautiful UI components with AI.
                </p>
            </div>

            {/* Demo Card */}
            <Link href="/app/ui-designer/demo" className="block mb-6">
                <Card className="p-6 border-2 border-dashed border-accent-primary/30 hover:border-accent-primary/50 bg-gradient-to-br from-accent-primary/5 to-transparent transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            ✨
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-text-primary">Try Demo Mode</h3>
                                <Badge variant="warning">Demo</Badge>
                            </div>
                            <p className="text-sm text-text-secondary mt-1">
                                Experience the UI Designer without connecting a project
                            </p>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-text-secondary group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
                    </div>
                </Card>
            </Link>

            {/* Projects Grid */}
            {projects.length > 0 ? (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">Your Projects</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/app/ui-designer/${project.id}`}
                                className="block group"
                            >
                                <Card className="p-5 hover:border-accent-primary/50 transition-all h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center">
                                                <FolderIcon className="w-5 h-5 text-text-secondary" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                                                    {project.name}
                                                </h3>
                                                <p className="text-xs text-text-muted font-mono">
                                                    {project.repo_full_name}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="success">Ready</Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                                        {project.laravel_version && (
                                            <span className="flex items-center gap-1">
                                                <span>🔺</span>
                                                {project.laravel_version}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <span>📁</span>
                                            {project.files_processed} files
                                        </span>
                                        {project.health_score && (
                                            <span className="flex items-center gap-1">
                                                <span>💚</span>
                                                {project.health_score}%
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-elevated flex items-center justify-center">
                        <FolderIcon className="w-8 h-8 text-text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Projects Ready</h3>
                    <p className="text-text-secondary mb-4">
                        You need at least one indexed project to use the UI Designer.
                    </p>
                    <Link
                        href="/app/projects/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create Project
                    </Link>
                </Card>
            )}

            {/* Features */}
            <div className="mt-12 pt-8 border-t border-border-subtle">
                <h2 className="text-lg font-semibold text-text-primary mb-6">What You Can Do</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <FeatureCard
                        icon="⚡"
                        title="Generate Components"
                        description="Describe any UI and get production-ready React/Vue components"
                    />
                    <FeatureCard
                        icon="🎯"
                        title="Match Your Stack"
                        description="AI detects your framework and generates matching code"
                    />
                    <FeatureCard
                        icon="📦"
                        title="Apply to Project"
                        description="One-click to add generated files to your codebase"
                    />
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="p-4 rounded-lg bg-bg-surface border border-border-subtle">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-medium text-text-primary mt-2">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
    );
}

function FolderIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}