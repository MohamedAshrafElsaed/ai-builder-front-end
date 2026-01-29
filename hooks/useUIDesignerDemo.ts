import { useCallback, useRef } from 'react';
import { useUIDesignerStore, selectIsGenerating } from '@/store/uiDesignerStore';
import { Agent, TechStack, DesignRequest, GeneratedFile } from '@/types/ui-designer';

// Mock data
const MOCK_AGENT: Agent = {
    type: 'palette',
    name: 'Palette',
    role: 'UI Designer',
    color: '#EC4899',
    icon: 'palette',
    avatar_emoji: '🎨',
    personality: 'I\'m Palette, your creative UI design assistant! I specialize in creating beautiful, modern interfaces using React, Vue, and other frameworks.',
};

const MOCK_TECH_STACK: TechStack = {
    framework: 'react',
    css_framework: 'tailwind',
    ui_libraries: ['shadcn/ui', 'radix'],
    typescript: true,
    component_path: 'resources/js/Components',
    style_path: 'resources/css',
    pages_path: 'resources/js/Pages',
    dark_mode_supported: true,
    confidence: 0.92,
    design_tokens: {
        colors: { primary: '#ec4899', background: '#0a0a0a' },
        spacing: { sm: '0.5rem', md: '1rem', lg: '1.5rem' },
        typography: {},
        borders: { radius: '0.5rem' },
    },
    existing_components: [
        { name: 'Button', path: 'components/ui/Button.tsx', props: ['variant', 'size'] },
        { name: 'Card', path: 'components/ui/Card.tsx', props: ['className'] },
    ],
};

const MOCK_GENERATED_FILE: GeneratedFile = {
    path: 'components/Dashboard.tsx',
    content: `"use client";

import React from 'react';
import { Card } from './ui/Card';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon?: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-zinc-100">{value}</p>
                    {change && (
                        <p className="mt-1 text-sm text-green-400">{change}</p>
                    )}
                </div>
                {icon && (
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
}

export function Dashboard() {
    const stats = [
        { title: 'Total Revenue', value: '$45,231', change: '+20.1%' },
        { title: 'Active Users', value: '2,350', change: '+15.2%' },
        { title: 'New Orders', value: '1,247', change: '+12.5%' },
        { title: 'Conversion Rate', value: '3.2%', change: '+4.1%' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
                <p className="text-zinc-500">Welcome back! Here's your overview.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4">
                        Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-800" />
                                <div className="flex-1">
                                    <p className="text-sm text-zinc-200">User action {i}</p>
                                    <p className="text-xs text-zinc-500">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {['New Order', 'Add User', 'Reports', 'Settings'].map((action) => (
                            <button
                                key={action}
                                className="p-4 text-sm font-medium text-zinc-300 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;`,
    type: 'component',
    language: 'tsx',
    line_count: 85,
    component_name: 'Dashboard',
    exports: ['Dashboard', 'StatCard', 'default: Dashboard'],
    dependencies: ['react'],
};

// Hook for demo mode
export function useUIDesignerDemo(projectId: string) {
    const store = useUIDesignerStore();
    const isGenerating = useUIDesignerStore(selectIsGenerating);
    const abortRef = useRef(false);

    // Initialize with mock data
    const initialize = useCallback(() => {
        store.setProjectId(projectId);
        store.setAgent(MOCK_AGENT);
        store.setTechStack(MOCK_TECH_STACK);
        store.addMessage('agent_greeting',
            `Hey there! I'm ${MOCK_AGENT.name}, your ${MOCK_AGENT.role}. ${MOCK_AGENT.avatar_emoji} I'm here to help you create beautiful UI components. Just describe what you'd like to build!`
        );
        store.addMessage('tech_detected', 'Detected your project technology stack.', {
            techStack: MOCK_TECH_STACK,
        });
    }, [projectId]);

    // Simulate streaming generation
    const startGeneration = useCallback(async (request: DesignRequest) => {
        abortRef.current = false;
        store.resetForNewGeneration();
        store.addMessage('user', request.prompt);

        // Simulate connection
        store.setStatus('connecting');
        await delay(500);
        if (abortRef.current) return;

        store.setDesignId(`demo-${Date.now()}`);
        store.addMessage('agent_message', 'Got it! Let me create that for you.');

        // Simulate thinking
        store.setStatus('detecting');
        const thoughts = [
            'Analyzing your request...',
            'Detecting technology stack...',
            'Planning component structure...',
            'Designing the layout...',
        ];

        for (const thought of thoughts) {
            if (abortRef.current) return;
            store.setCurrentThought(thought);
            await delay(800);
        }

        // Simulate optimization
        store.setStatus('optimizing');
        store.setCurrentThought('Optimizing prompt for best results...');
        await delay(600);
        if (abortRef.current) return;

        store.addMessage('agent_message', 'Enhanced your request with: XML structuring, chain of thought reasoning');

        // Simulate generation
        store.setStatus('generating');
        store.setCurrentThought('');
        store.addMessage('agent_message', 'Generating your UI components...');

        // Stream code character by character
        const codeChars = MOCK_GENERATED_FILE.content.split('');
        const chunkSize = 5;

        for (let i = 0; i < codeChars.length; i += chunkSize) {
            if (abortRef.current) return;
            const chunk = codeChars.slice(i, i + chunkSize).join('');
            store.appendStreamingCode(chunk);
            await delay(10);
        }

        // File ready
        store.clearStreamingCode();
        store.addGeneratedFile(MOCK_GENERATED_FILE);
        store.addMessage('file_generated', `Generated: ${MOCK_GENERATED_FILE.component_name}`, {
            file: MOCK_GENERATED_FILE,
        });

        // Complete
        const result = {
            success: true,
            total_files: 1,
            total_lines: MOCK_GENERATED_FILE.line_count,
            components_created: ['Dashboard', 'StatCard'],
            dependencies_added: [],
            duration_ms: 3500,
        };

        store.setStatus('complete');
        store.setResult(result);
        store.addMessage('design_complete', 'Design complete! Ready to apply.', { result });
    }, []);

    const cancelGeneration = useCallback(() => {
        abortRef.current = true;
        store.setStatus('cancelled');
        store.addMessage('agent_message', 'Generation cancelled.');
    }, []);

    const applyDesign = useCallback(async () => {
        store.setIsApplying(true);
        await delay(1500);
        store.setIsApplying(false);
        store.addMessage('agent_message', 'Successfully applied 1 file(s) to your project!');
        return {
            success: true,
            files_applied: [MOCK_GENERATED_FILE.path],
            files_skipped: [],
            backup_path: null,
            errors: [],
        };
    }, []);

    return {
        projectId: store.projectId,
        designId: store.designId,
        status: store.status,
        agent: store.agent,
        techStack: store.techStack,
        messages: store.messages,
        currentThought: store.currentThought,
        streamingCode: store.streamingCode,
        generatedFiles: store.generatedFiles,
        selectedFileIndex: store.selectedFileIndex,
        result: store.result,
        error: store.error,
        activeTab: store.activeTab,
        selectedFilesForApply: store.selectedFilesForApply,
        isApplying: store.isApplying,
        isGenerating,

        initialize,
        startGeneration,
        cancelGeneration,
        applyDesign,
        selectFile: store.selectFile,
        setActiveTab: store.setActiveTab,
        toggleFileSelection: store.toggleFileSelection,
        selectAllFiles: store.selectAllFiles,
        deselectAllFiles: store.deselectAllFiles,
        reset: store.reset,
    };
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}