"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function BillingPage() {
    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Billing</h1>
                <p className="text-text-secondary">Manage your subscription and usage.</p>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-text-primary">Pro Plan</h2>
                            <Badge variant="success">Active</Badge>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">Next billing date: Feb 28, 2026</p>
                    </div>
                    <Button variant="secondary">Manage Subscription</Button>
                </div>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                    <h3 className="text-sm font-medium text-text-secondary uppercase mb-2">Usage This Month</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-text-primary">$24.50</span>
                        <span className="text-sm text-text-secondary">/ $50.00 limit</span>
                    </div>
                    <div className="mt-4 w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
                        <div className="bg-accent-primary h-full w-[49%]"></div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-sm font-medium text-text-secondary uppercase mb-2">Payment Method</h3>
                    <div className="flex items-center gap-3 text-text-primary">
                        <div className="h-8 w-12 bg-bg-elevated rounded border border-border-default flex items-center justify-center font-bold text-xs">VISA</div>
                        <span>•••• 4242</span>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2">Update</Button>
                </Card>
            </div>
        </div>
    );
}
