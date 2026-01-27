"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Overview</h1>
                    <p className="text-text-secondary">Welcome back to Laravel AI.</p>
                </div>
                <Button>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Projects" value="12" change="+2.5%" />
                <StatsCard title="AI Operations" value="1,234" change="+12%" />
                <StatsCard title="Code Generated" value="45k lines" change="+8%" />
                <StatsCard title="Succeeded" value="99.9%" change="0%" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Projects */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">Recent Projects</h2>
                    <Card noPadding className="overflow-hidden">
                        <div className="divide-y divide-border-subtle">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-bg-elevated/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                                            <FolderIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-text-primary">E-commerce API</h3>
                                            <p className="text-xs text-text-secondary">Updated 2h ago</p>
                                        </div>
                                    </div>
                                    <Badge variant="success">Active</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* AI Status Panel */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">System Status</h2>
                    <Card className="bg-bg-elevated border-accent-primary/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-text-primary">AI Engine</span>
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success"></span>
                            </span>
                        </div>
                        <div className="space-y-4">
                            <StatusItem label="Context Window" value="128k" />
                            <StatusItem label="Latency" value="240ms" />
                            <StatusItem label="Queue" value="Empty" />
                        </div>
                        <div className="mt-6 pt-4 border-t border-border-default">
                            <p className="text-xs text-text-muted">System is running normally.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, change }: { title: string; value: string; change: string }) {
    return (
        <Card className="p-4">
            <div className="flex flex-col">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</span>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-text-primary">{value}</span>
                    <span className="text-xs font-medium text-status-success">{change}</span>
                </div>
            </div>
        </Card>
    );
}

function StatusItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{label}</span>
            <span className="font-medium text-text-primary font-mono">{value}</span>
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
