"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Project, HealthIssue } from "@/types";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const api = useApiClient();
    const router = useRouter();
    const { addToast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "stack" | "files" | "health">("overview");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    }, [id, api, addToast]);

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
            <ProjectHeader project={project} onDelete={() => setShowDeleteModal(true)} />

            {/* Quick Stats */}
            <QuickStats project={project} />

            {/* Tabs */}
            <div className="border-b border-border-subtle">
                <div className="flex gap-6 overflow-x-auto">
                    {["overview", "stack", "files", "health"].map((tab) => (
                        <Tab
                            key={tab}
                            label={tab.charAt(0).toUpperCase() + tab.slice(1)}
                            isActive={activeTab === tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === "overview" && <OverviewTab project={project} />}
                {activeTab === "stack" && <StackTab project={project} />}
                {activeTab === "files" && <FilesTab project={project} />}
                {activeTab === "health" && <HealthTab project={project} />}
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

// ============================================================================
// Header Component
// ============================================================================

function ProjectHeader({ project, onDelete }: { project: Project; onDelete: () => void }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
                    <StatusBadge status={project.status} />
                    {project.health_check?.production_ready && (
                        <Badge variant="success">Production Ready</Badge>
                    )}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                    <GitBranchIcon className="h-4 w-4" />
                    <span className="font-mono text-sm">{project.repo_full_name}</span>
                    <span className="text-text-muted">•</span>
                    <span className="text-sm">{project.default_branch}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" className="text-status-error hover:text-status-error hover:bg-status-error/10" onClick={onDelete}>
                    Delete
                </Button>
                <Button variant="secondary" onClick={() => window.open(project.repo_url, "_blank")}>
                    <GithubIcon className="h-4 w-4 mr-2" />
                    GitHub
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// Quick Stats
// ============================================================================

function QuickStats({ project }: { project: Project }) {
    const stats = [
        { label: "Health Score", value: `${project.health_score?.toFixed(1) || 0}%`, color: getHealthColor(project.health_score || 0) },
        { label: "Total Files", value: project.file_stats?.total_files.toLocaleString() || "0" },
        { label: "Lines of Code", value: project.file_stats?.total_lines.toLocaleString() || "0" },
        { label: "Laravel", value: project.laravel_version || "Unknown" },
        { label: "PHP", value: project.php_version || "Unknown" },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
                <Card key={i} className="p-4 text-center">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color || "text-text-primary"}`}>{stat.value}</p>
                </Card>
            ))}
        </div>
    );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ project }: { project: Project }) {
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                {/* Project Info */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <InfoIcon className="h-5 w-5 text-accent-primary" />
                        Project Information
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <InfoItem label="Repository" value={project.repo_full_name} mono />
                        <InfoItem label="Default Branch" value={project.default_branch} />
                        <InfoItem label="Status" value={<StatusBadge status={project.status} />} />
                        <InfoItem label="Indexed Files" value={project.indexed_files_count.toLocaleString()} />
                        <InfoItem label="Last Indexed" value={project.last_indexed_at ? new Date(project.last_indexed_at).toLocaleString() : "Never"} />
                        <InfoItem label="Created" value={new Date(project.created_at).toLocaleString()} />
                    </dl>
                </Card>

                {/* Detected Patterns */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <PatternIcon className="h-5 w-5 text-accent-primary" />
                        Detected Patterns
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {project.structure?.patterns_detected?.map((pattern) => (
                            <Badge key={pattern} variant="outline" className="capitalize">
                                {pattern.replace(/-/g, " ")}
                            </Badge>
                        ))}
                        {project.structure?.has_tests && <Badge variant="success">Has Tests</Badge>}
                        {project.structure?.has_migrations && <Badge variant="default">Has Migrations</Badge>}
                        {project.structure?.has_factories && <Badge variant="default">Has Factories</Badge>}
                    </div>
                </Card>

                {/* Key Files */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileIcon className="h-5 w-5 text-accent-primary" />
                        Key Files
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {project.structure?.key_files?.map((file) => (
                            <div key={file} className="flex items-center gap-2 p-2 rounded-md bg-bg-elevated text-sm font-mono text-text-secondary">
                                <FileDocIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{file}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Health Summary */}
                <Card className="bg-gradient-to-br from-bg-surface to-bg-elevated">
                    <h3 className="text-lg font-semibold mb-4">Health Overview</h3>
                    <div className="flex items-center justify-center mb-4">
                        <HealthScoreRing score={project.health_score || 0} />
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Critical Issues</span>
                            <span className="font-medium text-status-error">{project.health_check?.critical_issues?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Warnings</span>
                            <span className="font-medium text-status-warning">{project.health_check?.warnings?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Info</span>
                            <span className="font-medium text-status-info">{project.health_check?.info?.length || 0}</span>
                        </div>
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <Button variant="secondary" className="w-full justify-start">
                            <RefreshIcon className="h-4 w-4 mr-2" />
                            Re-index Project
                        </Button>
                        <Button variant="secondary" className="w-full justify-start">
                            <ChatIcon className="h-4 w-4 mr-2" />
                            Start AI Chat
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ============================================================================
// Stack Tab
// ============================================================================

function StackTab({ project }: { project: Project }) {
    const { stack } = project;
    if (!stack) return <EmptyState message="No stack information available" />;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Backend */}
            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ServerIcon className="h-5 w-5 text-orange-500" />
                    Backend
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-bg-elevated rounded-lg">
                        <LaravelIcon className="h-10 w-10" />
                        <div>
                            <p className="font-semibold text-text-primary capitalize">{stack.backend.framework}</p>
                            <p className="text-sm text-text-secondary">v{stack.backend.version} • PHP {stack.backend.php_version}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase mb-2">Installed Packages</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(stack.backend.packages)
                                .filter(([, installed]) => installed)
                                .map(([pkg]) => (
                                    <Badge key={pkg} variant="outline" className="capitalize">{pkg}</Badge>
                                ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Frontend */}
            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <LayoutIcon className="h-5 w-5 text-blue-500" />
                    Frontend
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-bg-elevated rounded-lg">
                        {stack.frontend.framework === "vue" ? <VueIcon className="h-10 w-10" /> : <ReactIcon className="h-10 w-10" />}
                        <div>
                            <p className="font-semibold text-text-primary capitalize">{stack.frontend.framework}</p>
                            <p className="text-sm text-text-secondary">v{stack.frontend.version}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <StackItem label="Build Tool" value={stack.frontend.build_tool} />
                        <StackItem label="CSS" value={stack.frontend.css_framework} />
                        <StackItem label="TypeScript" value={stack.frontend.typescript ? "Yes" : "No"} />
                        <StackItem label="Inertia" value={stack.frontend.inertia ? "Yes" : "No"} />
                        {stack.frontend.ui_library && <StackItem label="UI Library" value={stack.frontend.ui_library} />}
                    </div>
                </div>
            </Card>

            {/* Infrastructure */}
            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5 text-green-500" />
                    Infrastructure
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <StackItem label="Database" value={stack.database} icon={<DatabaseIcon className="h-4 w-4" />} />
                    <StackItem label="Cache" value={stack.cache} icon={<CacheIcon className="h-4 w-4" />} />
                    <StackItem label="Queue" value={stack.queue} icon={<QueueIcon className="h-4 w-4" />} />
                    <StackItem label="Realtime" value={stack.realtime || "None"} icon={<BroadcastIcon className="h-4 w-4" />} />
                </div>
            </Card>

            {/* Testing & CI/CD */}
            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TestIcon className="h-5 w-5 text-purple-500" />
                    Testing & CI/CD
                </h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-text-muted uppercase mb-2">Testing</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(stack.testing)
                                .filter(([, enabled]) => enabled)
                                .map(([tool]) => (
                                    <Badge key={tool} variant="success" className="capitalize">{tool}</Badge>
                                ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase mb-2">CI/CD</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(stack.ci_cd)
                                .filter(([, enabled]) => enabled)
                                .map(([tool]) => (
                                    <Badge key={tool} variant="default" className="capitalize">{tool.replace(/_/g, " ")}</Badge>
                                ))}
                            {!Object.values(stack.ci_cd).some(Boolean) && (
                                <span className="text-sm text-text-muted">No CI/CD detected</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase mb-2">Deployment</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(stack.deployment)
                                .filter(([, enabled]) => enabled)
                                .map(([tool]) => (
                                    <Badge key={tool} variant="default" className="capitalize">{tool}</Badge>
                                ))}
                            {!Object.values(stack.deployment).some(Boolean) && (
                                <span className="text-sm text-text-muted">No deployment config detected</span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// Files Tab
// ============================================================================

function FilesTab({ project }: { project: Project }) {
    const { file_stats } = project;
    if (!file_stats) return <EmptyState message="No file statistics available" />;

    const fileTypes = Object.entries(file_stats.by_type)
        .sort((a, b) => b[1].lines - a[1].lines)
        .slice(0, 10);

    const categories = Object.entries(file_stats.by_category)
        .sort((a, b) => b[1] - a[1]);

    const maxLines = Math.max(...fileTypes.map(([, data]) => data.lines));

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* File Types Distribution */}
            <Card className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ChartIcon className="h-5 w-5 text-accent-primary" />
                    Code Distribution by File Type
                </h3>
                <div className="space-y-3">
                    {fileTypes.map(([type, data]) => (
                        <div key={type} className="flex items-center gap-4">
                            <div className="w-16 text-sm font-mono text-text-secondary">.{type}</div>
                            <div className="flex-1">
                                <div className="h-6 bg-bg-elevated rounded-md overflow-hidden">
                                    <div
                                        className="h-full rounded-md transition-all duration-500"
                                        style={{
                                            width: `${(data.lines / maxLines) * 100}%`,
                                            backgroundColor: getFileTypeColor(type),
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="w-24 text-right text-sm">
                                <span className="font-medium text-text-primary">{data.lines.toLocaleString()}</span>
                                <span className="text-text-muted ml-1">lines</span>
                            </div>
                            <div className="w-16 text-right text-sm text-text-muted">
                                {data.count} files
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Categories */}
            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FolderIcon className="h-5 w-5 text-accent-primary" />
                    Files by Category
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {categories.map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-2 bg-bg-elevated rounded-md">
                            <span className="text-sm capitalize text-text-secondary">{category}</span>
                            <Badge variant="default">{count}</Badge>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Largest Files */}
            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileIcon className="h-5 w-5 text-accent-primary" />
                    Largest Files
                </h3>
                <div className="space-y-2">
                    {file_stats.largest_files.slice(0, 8).map((file, i) => (
                        <div key={file.path} className="flex items-center gap-3 p-2 bg-bg-elevated rounded-md">
                            <span className="text-xs text-text-muted w-5">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-mono truncate text-text-primary">{file.path.split("/").pop()}</p>
                                <p className="text-xs text-text-muted truncate">{file.path}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-text-primary">{file.lines.toLocaleString()}</p>
                                <p className="text-xs text-text-muted">lines</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// Health Tab
// ============================================================================

function HealthTab({ project }: { project: Project }) {
    const { health_check } = project;
    if (!health_check) return <EmptyState message="No health check data available" />;

    const categories = Object.entries(health_check.categories).sort((a, b) => a[1].score - b[1].score);

    return (
        <div className="space-y-6">
            {/* Score Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map(([category, data]) => (
                    <Card key={category} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm capitalize text-text-secondary">{category.replace(/_/g, " ")}</span>
                            {data.issues > 0 && (
                                <Badge variant={data.score < 70 ? "error" : data.score < 85 ? "warning" : "default"}>
                                    {data.issues} issues
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${data.score}%`,
                                            backgroundColor: getScoreColor(data.score),
                                        }}
                                    />
                                </div>
                            </div>
                            <span className="text-lg font-bold" style={{ color: getScoreColor(data.score) }}>
                                {data.score}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Issues Lists */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Critical Issues */}
                {health_check.critical_issues.length > 0 && (
                    <Card className="lg:col-span-2 border-status-error/30">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-status-error">
                            <AlertIcon className="h-5 w-5" />
                            Critical Issues ({health_check.critical_issues.length})
                        </h3>
                        <div className="space-y-3">
                            {health_check.critical_issues.map((issue, i) => (
                                <IssueCard key={i} issue={issue} />
                            ))}
                        </div>
                    </Card>
                )}

                {/* Warnings */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-status-warning">
                        <WarningIcon className="h-5 w-5" />
                        Warnings ({health_check.warnings.length})
                    </h3>
                    <div className="space-y-3">
                        {health_check.warnings.map((issue, i) => (
                            <IssueCard key={i} issue={issue} />
                        ))}
                        {health_check.warnings.length === 0 && (
                            <p className="text-text-muted text-sm">No warnings found</p>
                        )}
                    </div>
                </Card>

                {/* Info */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-status-info">
                        <InfoCircleIcon className="h-5 w-5" />
                        Suggestions ({health_check.info.length})
                    </h3>
                    <div className="space-y-3">
                        {health_check.info.map((issue, i) => (
                            <IssueCard key={i} issue={issue} />
                        ))}
                        {health_check.info.length === 0 && (
                            <p className="text-text-muted text-sm">No suggestions</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function IssueCard({ issue }: { issue: HealthIssue }) {
    return (
        <div className="p-3 bg-bg-elevated rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-text-primary text-sm">{issue.title}</h4>
                {issue.auto_fixable && <Badge variant="success" className="text-xs">Auto-fixable</Badge>}
            </div>
            <p className="text-xs text-text-secondary">{issue.description}</p>
            {issue.file_path && (
                <p className="text-xs font-mono text-text-muted bg-bg-base px-2 py-1 rounded inline-block">
                    {issue.file_path}{issue.line_number && `:${issue.line_number}`}
                </p>
            )}
            <p className="text-xs text-accent-primary">💡 {issue.suggestion}</p>
        </div>
    );
}

// ============================================================================
// Shared Components
// ============================================================================

function Tab({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive ? "border-accent-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
        >
            {label}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { variant: "success" | "warning" | "error" | "default"; label: string }> = {
        ready: { variant: "success", label: "Ready" },
        indexing: { variant: "warning", label: "Indexing" },
        error: { variant: "error", label: "Error" },
        pending: { variant: "default", label: "Pending" },
    };
    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
}

function InfoItem({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div>
            <dt className="text-sm text-text-muted mb-1">{label}</dt>
            <dd className={`font-medium text-text-primary ${mono ? "font-mono text-sm" : ""}`}>{value}</dd>
        </div>
    );
}

function StackItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="p-2 bg-bg-elevated rounded-md">
            <p className="text-xs text-text-muted mb-1">{label}</p>
            <p className="font-medium text-text-primary capitalize flex items-center gap-2">
                {icon}
                {value}
            </p>
        </div>
    );
}

function HealthScoreRing({ score }: { score: number }) {
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative">
            <svg height={radius * 2} width={radius * 2}>
                <circle stroke="var(--bg-elevated)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
                <circle
                    stroke={getScoreColor(score)}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference + " " + circumference}
                    style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease" }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    transform={`rotate(-90 ${radius} ${radius})`}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: getScoreColor(score) }}>{score.toFixed(0)}</span>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center h-64 text-text-muted">
            <p>{message}</p>
        </div>
    );
}

function ProjectSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-32" /></div>
            <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-96" />
        </div>
    );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getHealthColor(score: number): string {
    if (score >= 80) return "text-status-success";
    if (score >= 60) return "text-status-warning";
    return "text-status-error";
}

function getScoreColor(score: number): string {
    if (score >= 80) return "var(--status-success)";
    if (score >= 60) return "var(--status-warning)";
    return "var(--status-error)";
}

function getFileTypeColor(type: string): string {
    const colors: Record<string, string> = {
        php: "#4F5D95", vue: "#42B883", ts: "#3178C6", js: "#F7DF1E",
        css: "#264de4", json: "#292929", md: "#083fa1", xml: "#e34c26",
        yaml: "#cb171e", svg: "#FFB13B", blade: "#F05340",
    };
    return colors[type] || "var(--accent-primary)";
}

// ============================================================================
// Icons
// ============================================================================

function GithubIcon({ className }: { className?: string }) {
    return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
}
function GitBranchIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 3v12m0 0a3 3 0 106 0 3 3 0 00-6 0zm12-3a3 3 0 11-6 0 3 3 0 016 0zM6 15a9 9 0 009-9" /></svg>;
}
function InfoIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function PatternIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
}
function FileIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function FileDocIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}
function RefreshIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function ChatIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
function ServerIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
}
function LayoutIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
}
function DatabaseIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
}
function CacheIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
}
function QueueIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
}
function BroadcastIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>;
}
function TestIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ChartIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function FolderIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
}
function AlertIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function WarningIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function InfoCircleIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function LaravelIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 50 52" fill="none"><path d="M49.626 11.564a.809.809 0 01.028.209v10.972a.8.8 0 01-.402.694l-9.209 5.302V39.25c0 .286-.152.55-.4.694L20.42 51.01c-.044.025-.092.041-.14.058-.018.006-.035.017-.054.022a.805.805 0 01-.41 0c-.022-.006-.042-.018-.063-.026-.044-.016-.09-.03-.132-.054L.402 39.944A.801.801 0 010 39.25V6.334c0-.072.01-.142.028-.21.006-.023.02-.044.028-.067.015-.042.029-.085.051-.124.015-.026.037-.047.055-.071.023-.032.044-.065.071-.093.023-.023.053-.04.079-.06.029-.024.055-.05.088-.069h.001l9.61-5.533a.802.802 0 01.8 0l9.61 5.533h.002c.032.02.059.045.088.068.026.02.055.038.078.06.028.029.048.062.072.094.017.024.04.045.054.071.023.04.036.082.052.124.008.023.022.044.028.068a.809.809 0 01.028.209v20.559l8.008-4.611v-10.51c0-.07.01-.141.028-.208.007-.024.02-.045.028-.068.016-.042.03-.085.052-.124.015-.026.037-.047.054-.071.024-.032.044-.065.072-.093.023-.023.052-.04.078-.06.03-.024.056-.05.088-.069h.001l9.611-5.533a.801.801 0 01.8 0l9.61 5.533c.034.02.06.045.09.068.025.02.054.038.077.06.028.029.048.062.072.094.018.024.04.045.054.071.023.039.036.082.052.124.009.023.022.044.028.068zm-1.574 10.718v-9.124l-3.363 1.936-4.646 2.675v9.124l8.01-4.611zm-9.61 16.505v-9.13l-4.57 2.61-13.05 7.448v9.216l17.62-10.144zM1.602 7.719v31.068L19.22 48.93v-9.214l-9.204-5.209-.003-.002-.004-.002c-.031-.018-.057-.044-.086-.066-.025-.02-.054-.036-.076-.058l-.002-.003c-.026-.025-.044-.056-.066-.084-.02-.027-.044-.05-.06-.078l-.001-.003c-.018-.03-.029-.066-.042-.1-.013-.03-.03-.058-.038-.09v-.001c-.01-.038-.012-.078-.016-.117-.004-.03-.012-.06-.012-.09v-21.48L4.965 9.654 1.602 7.72zm8.81-5.994L2.405 6.334l8.005 4.609 8.006-4.61-8.006-4.608zm4.164 28.764l4.645-2.674V7.719l-3.363 1.936-4.646 2.675v20.096l3.364-1.937zM39.243 7.164l-8.006 4.609 8.006 4.609 8.005-4.61-8.005-4.608zm-.801 10.605l-4.646-2.675-3.363-1.936v9.124l4.645 2.674 3.364 1.937v-9.124zM20.02 38.33l11.743-6.704 5.87-3.35-8-4.606-9.211 5.303-8.395 4.833 7.993 4.524z" fill="#FF2D20"/></svg>;
}
function VueIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 256 221"><path d="M204.8 0H256L128 220.8 0 0h97.92L128 51.2 157.44 0h47.36z" fill="#41B883"/><path d="M0 0l128 220.8L256 0h-51.2L128 132.48 50.56 0H0z" fill="#41B883"/><path d="M50.56 0L128 133.12 204.8 0h-47.36L128 51.2 97.92 0H50.56z" fill="#35495E"/></svg>;
}
function ReactIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 256 228"><path d="M210.483 73.824a171.49 171.49 0 00-8.24-2.597c.465-1.9.893-3.777 1.273-5.621 6.238-30.281 2.16-54.676-11.769-62.708-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 00-6.375 5.848 155.866 155.866 0 00-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233 50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 001.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 006.921 2.165 167.467 167.467 0 00-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266 13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 005.342-4.923 168.064 168.064 0 006.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586 13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 00-1.535-6.842c1.62-.48 3.21-.985 4.76-1.52 29.151-10.09 48.44-25.38 48.44-41.513 0-15.612-18.058-30.308-45.996-40.32zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345-3.24-10.257-7.612-21.163-12.963-32.432 5.106-11 9.31-21.767 12.459-31.957 2.619.758 5.16 1.557 7.61 2.4 23.69 8.156 38.14 20.213 38.14 29.504 0 9.896-15.606 22.743-40.946 31.14zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787-1.524 8.219-4.59 13.698-8.382 15.893-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 01-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246 12.376-1.098 24.068-2.894 34.671-5.345.522 2.107.986 4.173 1.386 6.193zM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 011.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994 7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 01-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94zM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863-6.35-5.437-9.555-10.836-9.555-15.216 0-9.322 13.897-21.212 37.076-29.293 2.813-.98 5.757-1.905 8.812-2.773 3.204 10.42 7.406 21.315 12.477 32.332-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 01-6.318-1.979zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789 8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 013.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 01-1.76-7.888zm110.427 27.268a347.8 347.8 0 00-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 00-7.365-13.322zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 00-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18zM82.802 87.83a323.167 323.167 0 00-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152 7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 00-7.848 12.897zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793 2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 007.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433 4.902.192 9.899.29 14.978.29 5.218 0 10.376-.117 15.453-.343-4.985 6.774-10.018 12.97-15.028 18.486zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 007.859-13.026 347.403 347.403 0 007.425-13.565zm-16.898 8.101a358.557 358.557 0 01-12.281 19.815 329.4 329.4 0 01-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 01-12.513-19.846h.001a307.41 307.41 0 01-10.923-20.627 310.278 310.278 0 0110.89-20.637l-.001.001a307.318 307.318 0 0112.413-19.761c7.613-.576 15.42-.876 23.31-.876 7.93 0 15.779.295 23.396.869a307.226 307.226 0 0112.334 19.695 358.489 358.489 0 0111.036 20.54 329.472 329.472 0 01-11.04 20.736zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026-.344 1.668-.73 3.367-1.15 5.09-10.622-2.452-22.155-4.275-34.23-5.408-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 015.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3zM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86-22.86-10.235-22.86-22.86 10.236-22.86 22.86-22.86z" fill="#61DAFB"/></svg>;
}