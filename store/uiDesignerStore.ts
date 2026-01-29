// store/uiDesignerStore.ts - Zustand store for UI Designer
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    Agent, TechStack, GeneratedFile, DesignResult, Message,
    DesignStatus, ActiveTab, DesignRequest, ApplyResult, generateId
} from '@/types/ui-designer';

interface UIDesignerState {
    // Connection
    projectId: string | null;
    designId: string | null;
    status: DesignStatus;
    abortController: AbortController | null;

    // Agent
    agent: Agent | null;

    // Tech Stack
    techStack: TechStack | null;

    // Messages
    messages: Message[];

    // Generation
    currentThought: string;
    streamingCode: string;
    generatedFiles: GeneratedFile[];
    selectedFileIndex: number;

    // Result
    result: DesignResult | null;
    error: string | null;

    // UI State
    activeTab: ActiveTab;
    selectedFilesForApply: Set<string>;
    isApplying: boolean;

    // Actions
    setProjectId: (id: string) => void;
    setAgent: (agent: Agent) => void;
    setTechStack: (techStack: TechStack) => void;
    setStatus: (status: DesignStatus) => void;
    setDesignId: (id: string) => void;
    setCurrentThought: (thought: string) => void;
    appendStreamingCode: (chunk: string) => void;
    clearStreamingCode: () => void;
    addGeneratedFile: (file: GeneratedFile) => void;
    setGeneratedFiles: (files: GeneratedFile[]) => void;
    setResult: (result: DesignResult) => void;
    setError: (error: string | null) => void;
    addMessage: (type: Message['type'], content: string, metadata?: Message['metadata']) => void;
    selectFile: (index: number) => void;
    setActiveTab: (tab: ActiveTab) => void;
    toggleFileSelection: (path: string) => void;
    selectAllFiles: () => void;
    deselectAllFiles: () => void;
    setAbortController: (controller: AbortController | null) => void;
    setIsApplying: (applying: boolean) => void;
    reset: () => void;
    resetForNewGeneration: () => void;
}

const initialState = {
    projectId: null,
    designId: null,
    status: 'idle' as DesignStatus,
    abortController: null,
    agent: null,
    techStack: null,
    messages: [],
    currentThought: '',
    streamingCode: '',
    generatedFiles: [],
    selectedFileIndex: 0,
    result: null,
    error: null,
    activeTab: 'code' as ActiveTab,
    selectedFilesForApply: new Set<string>(),
    isApplying: false,
};

export const useUIDesignerStore = create<UIDesignerState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            setProjectId: (id) => set({ projectId: id }),

            setAgent: (agent) => set({ agent }),

            setTechStack: (techStack) => set({ techStack }),

            setStatus: (status) => set({ status }),

            setDesignId: (id) => set({ designId: id }),

            setCurrentThought: (thought) => set({ currentThought: thought }),

            appendStreamingCode: (chunk) => set((state) => ({
                streamingCode: state.streamingCode + chunk
            })),

            clearStreamingCode: () => set({ streamingCode: '' }),

            addGeneratedFile: (file) => set((state) => {
                const newFiles = [...state.generatedFiles, file];
                const newSelected = new Set(state.selectedFilesForApply);
                newSelected.add(file.path);
                return {
                    generatedFiles: newFiles,
                    selectedFilesForApply: newSelected,
                    selectedFileIndex: newFiles.length - 1,
                };
            }),

            setGeneratedFiles: (files) => {
                const selected = new Set(files.map(f => f.path));
                set({
                    generatedFiles: files,
                    selectedFilesForApply: selected,
                    selectedFileIndex: files.length > 0 ? 0 : -1,
                });
            },

            setResult: (result) => set({ result }),

            setError: (error) => set({ error, status: error ? 'error' : get().status }),

            addMessage: (type, content, metadata) => set((state) => ({
                messages: [
                    ...state.messages,
                    {
                        id: generateId(),
                        type,
                        content,
                        timestamp: new Date(),
                        metadata,
                    },
                ],
            })),

            selectFile: (index) => set({ selectedFileIndex: index }),

            setActiveTab: (tab) => set({ activeTab: tab }),

            toggleFileSelection: (path) => set((state) => {
                const newSelected = new Set(state.selectedFilesForApply);
                if (newSelected.has(path)) {
                    newSelected.delete(path);
                } else {
                    newSelected.add(path);
                }
                return { selectedFilesForApply: newSelected };
            }),

            selectAllFiles: () => set((state) => ({
                selectedFilesForApply: new Set(state.generatedFiles.map(f => f.path))
            })),

            deselectAllFiles: () => set({ selectedFilesForApply: new Set() }),

            setAbortController: (controller) => set({ abortController: controller }),

            setIsApplying: (applying) => set({ isApplying: applying }),

            reset: () => set(initialState),

            resetForNewGeneration: () => set((state) => ({
                designId: null,
                status: 'idle',
                currentThought: '',
                streamingCode: '',
                generatedFiles: [],
                selectedFileIndex: 0,
                result: null,
                error: null,
                selectedFilesForApply: new Set(),
                // Keep: projectId, agent, techStack, messages, activeTab
            })),
        }),
        { name: 'ui-designer-store' }
    )
);

// Selectors for optimized re-renders
export const selectIsGenerating = (state: UIDesignerState) =>
    ['connecting', 'detecting', 'optimizing', 'generating'].includes(state.status);

export const selectCurrentFile = (state: UIDesignerState) =>
    state.generatedFiles[state.selectedFileIndex] || null;

export const selectFileCount = (state: UIDesignerState) =>
    state.generatedFiles.length;

export const selectTotalLines = (state: UIDesignerState) =>
    state.generatedFiles.reduce((sum, f) => sum + f.line_count, 0);

export const selectSelectedFileCount = (state: UIDesignerState) =>
    state.selectedFilesForApply.size;