"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";

export default function SettingsPage() {
    const { user } = useApp();

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary">Manage your account and preferences.</p>
            </div>

            <Card className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Profile</h2>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-bg-elevated flex items-center justify-center text-xl font-bold text-text-secondary">
                            {user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                            <p className="font-medium text-text-primary">{user?.name}</p>
                            <p className="text-sm text-text-secondary">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border-subtle">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Integrations</h2>
                    <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg border border-border-default">
                        <div className="flex items-center gap-3">
                            <GitHubIcon className="h-6 w-6" />
                            <div>
                                <p className="font-medium text-text-primary">GitHub</p>
                                <p className="text-xs text-text-secondary">Connected as {user?.name}</p>
                            </div>
                        </div>
                        <Badge variant="success">Connected</Badge>
                    </div>
                </div>

                <div className="pt-6 border-t border-border-subtle">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Preferences</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-text-primary">Theme</p>
                                <p className="text-xs text-text-secondary">Customize interface appearance</p>
                            </div>
                            <select className="bg-bg-surface border border-border-default rounded-md text-sm px-3 py-1.5 focus:outline-none focus:border-accent-primary">
                                <option>System</option>
                                <option>Dark</option>
                                <option>Light</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button variant="secondary">Save Changes</Button>
            </div>
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
