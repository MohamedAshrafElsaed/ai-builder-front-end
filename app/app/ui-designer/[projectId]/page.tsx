"use client";

import { useParams } from 'next/navigation';
import { UIDesignerLayout } from '@/components/ui-designer/UIDesignerLayout';

export default function UIDesignerPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    if (!projectId) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
                <p className="text-zinc-500">Invalid project ID</p>
            </div>
        );
    }

    return <UIDesignerLayout projectId={projectId} />;
}