"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useApiClient } from "@/hooks/useApiClient";
import { useToast } from "@/components/ui/Toast";
import { GitHubRepo, GitHubAppStatus } from "@/types";

type Step = "app_check" | "repo_select" | "creating";

// GitHub App name from your backend config
const GITHUB_APP_NAME = "maestroai-dev";

function CreateProjectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const api = useApiClient();
    const { addToast } = useToast();

    const [step, setStep] = useState<Step>("app_check");
    const [isLoading, setIsLoading] = useState(true);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);

    // Check for installation_id in URL (GitHub redirects here after app install)
    useEffect(() => {
        const installationId = searchParams.get("installation_id");
        const setupAction = searchParams.get("setup_action");

        console.log("[PROJECTS/NEW] URL params:", { installationId, setupAction });

        if (installationId) {
            // GitHub just redirected back after installation
            handleInstallationCallback(installationId);
        } else {
            // Normal page load - check status
            checkAppStatus();
        }
    }, [searchParams]);

    const handleInstallationCallback = async (installationId: string) => {
        try {
            setIsLoading(true);
            console.log("[PROJECTS/NEW] Saving installation:", installationId);

            // Send installation_id to backend to link with user
            await api.post("/github-app/installations", {
                installation_id: parseInt(installationId, 10),
            });

            addToast("GitHub App installed successfully!", "success");

            // Clear URL params and proceed to repo selection
            router.replace("/app/projects/new");
            setStep("repo_select");
            await fetchRepos();
        } catch (error: any) {
            console.error("[PROJECTS/NEW] Failed to save installation:", error);

            // If endpoint doesn't exist, try the status check anyway
            if (error.status === 404) {
                // Backend might not have this endpoint, try checking status directly
                await checkAppStatus();
            } else {
                addToast(error.message || "Failed to complete GitHub App setup", "error");
                setIsLoading(false);
            }
        }
    };

    const checkAppStatus = async () => {
        try {
            setIsLoading(true);
            const status = await api.get<GitHubAppStatus>("/github-app/status");

            console.log("[PROJECTS/NEW] App status:", status);

            if (status.installed) {
                setStep("repo_select");
                await fetchRepos();
            } else {
                setStep("app_check");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("[PROJECTS/NEW] Failed to check GitHub App status:", error);
            setStep("app_check");
            setIsLoading(false);
        }
    };

    const fetchRepos = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<GitHubRepo[]>("/github/repos");
            setRepos(data);
        } catch (error) {
            console.error("[PROJECTS/NEW] Failed to fetch repos:", error);
            addToast("Failed to load repositories", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInstallApp = () => {
        // Redirect directly to GitHub App installation page
        const installUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new`;
        window.location.href = installUrl;
    };

    const handleRefreshStatus = async () => {
        await checkAppStatus();
    };

    const handleCreateProject = async () => {
        if (!selectedRepoId) return;

        try {
            setStep("creating");
            const response = await api.post<{ id: string }>("/projects", {
                github_repo_id: selectedRepoId,
            });

            addToast("Project created successfully", "success");
            router.push(`/app/projects/${response.id}`);
        } catch (error: any) {
            console.error("[PROJECTS/NEW] Failed to create project:", error);
            addToast(error.message || "Failed to create project", "error");
            setStep("repo_select");
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Create New Project</h1>
                <p className="text-text-secondary">Connect a repository to start analyzing.</p>
            </div>

            <StepIndicator currentStep={step} />

            <Card className="min-h-[400px]">
                {step === "app_check" && (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                        {isLoading ? (
                            <>
                                <div className="h-12 w-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-text-secondary">Checking GitHub App status...</p>
                            </>
                        ) : (
                            <>
                                <div className="bg-bg-elevated p-4 rounded-full">
                                    <GitHubIcon className="h-12 w-12 text-text-primary" />
                                </div>
                                <div className="space-y-2 max-w-md">
                                    <h3 className="text-xl font-semibold text-text-primary">Install GitHub App</h3>
                                    <p className="text-text-secondary">
                                        To analyze your codebase, we need read access to your repositories.
                                        Please install our GitHub App to proceed.
                                    </p>
                                </div>
                                <Button size="lg" onClick={handleInstallApp}>
                                    Install GitHub App
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefreshStatus}
                                    isLoading={isLoading}
                                >
                                    I've already installed it
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {step === "repo_select" && (
                    <div className="space-y-6">
                        <Input
                            placeholder="Search repositories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-md"
                        />

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-bg-elevated/50 animate-pulse rounded-md" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {filteredRepos.map((repo) => (
                                    <button
                                        key={repo.id}
                                        onClick={() => setSelectedRepoId(repo.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${selectedRepoId === repo.id
                                                ? "border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary"
                                                : "border-border-default hover:bg-bg-elevated"
                                            }`}
                                    >
                                        <div className="text-left">
                                            <p className="font-medium text-text-primary">{repo.full_name}</p>
                                            <p className="text-xs text-text-secondary">
                                                {repo.description || "No description"}
                                            </p>
                                        </div>
                                        {repo.private && <Badge variant="outline">Private</Badge>}
                                    </button>
                                ))}

                                {filteredRepos.length === 0 && !isLoading && (
                                    <p className="text-center text-text-secondary py-8">
                                        No repositories found. Make sure you've granted access to repositories when installing the GitHub App.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-border-subtle">
                            <Button
                                disabled={!selectedRepoId}
                                onClick={handleCreateProject}
                            >
                                Create Project
                            </Button>
                        </div>
                    </div>
                )}

                {step === "creating" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="h-12 w-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-text-primary">Creating Project...</h3>
                            <p className="text-text-secondary">
                                We're setting up the environment for your repository.
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
    const steps = [
        { id: "app_check", label: "Install App" },
        { id: "repo_select", label: "Select Repo" },
        { id: "creating", label: "Create" },
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="flex items-center justify-center gap-4 text-sm">
            {steps.map((step, index) => {
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;

                return (
                    <div key={step.id} className="flex items-center gap-2">
                        <div className={`h-8 w-8 flex items-center justify-center rounded-full font-medium transition-colors ${isActive
                                ? "bg-accent-primary text-white"
                                : isCompleted
                                    ? "bg-status-success text-white"
                                    : "bg-bg-elevated text-text-secondary"
                            }`}>
                            {isCompleted ? "✓" : index + 1}
                        </div>
                        <span className={isActive ? "text-text-primary font-medium" : "text-text-secondary"}>
                            {step.label}
                        </span>
                        {index < steps.length - 1 && (
                            <div className="w-12 h-px bg-border-default mx-2" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

function LoadingFallback() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <div className="h-8 w-48 bg-bg-elevated animate-pulse rounded" />
                <div className="h-4 w-64 bg-bg-elevated animate-pulse rounded mt-2" />
            </div>
            <div className="h-12 bg-bg-elevated animate-pulse rounded" />
            <Card className="min-h-[400px] flex items-center justify-center">
                <div className="h-12 w-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </Card>
        </div>
    );
}

export default function CreateProjectPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CreateProjectContent />
        </Suspense>
    );
}