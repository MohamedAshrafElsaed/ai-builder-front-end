
export interface Project {
    id: string;
    name: string;
    repo_full_name: string;
    repo_url: string;
    default_branch: string;
    clone_path: string;
    status: 'pending' | 'indexing' | 'ready' | 'error';
    indexed_files_count: number;
    laravel_version: string | null;
    error_message: string | null;
    last_indexed_at: string | null;
    created_at: string;
    updated_at: string;
    stack: ProjectStack;
    file_stats: FileStats;
    health_score: number | null;
    scan_progress: number;
    scan_message: string | null;
    scanned_at: string | null;
    php_version: string | null;
    structure: ProjectStructure;
    health_check: HealthCheck;
}

export interface ProjectStack {
    backend: {
        framework: string;
        version: string;
        language: string;
        php_version: string;
        packages: Record<string, boolean>;
    };
    frontend: {
        build_tool: string;
        typescript: boolean;
        css_framework: string;
        framework: string;
        version: string;
        composition_api: boolean;
        inertia: boolean;
        router: boolean;
        state: string | null;
        ui_library: string | null;
    };
    database: string;
    cache: string;
    queue: string;
    realtime: string | null;
    testing: Record<string, boolean>;
    ci_cd: Record<string, boolean>;
    deployment: Record<string, boolean>;
}

export interface FileStats {
    total_files: number;
    total_lines: number;
    by_type: Record<string, { count: number; lines: number }>;
    by_category: Record<string, number>;
    directories: string[];
    largest_files: Array<{
        path: string;
        type: string;
        lines: number;
        category: string | null;
        size: number;
    }>;
}

export interface ProjectStructure {
    directories: string[];
    key_files: string[];
    patterns_detected: string[];
    has_tests: boolean;
    has_migrations: boolean;
    has_seeders: boolean;
    has_factories: boolean;
}

export interface HealthCheck {
    score: number;
    categories: Record<string, { score: number; issues: number }>;
    critical_issues: HealthIssue[];
    warnings: HealthIssue[];
    info: HealthIssue[];
    total_issues: number;
    production_ready: boolean;
}

export interface HealthIssue {
    category: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    file_path: string | null;
    line_number: number | null;
    suggestion: string;
    auto_fixable: boolean;
}

export interface GitHubRepo {
    id: number;
    full_name: string;
    name: string;
    private: boolean;
    description: string | null;
    updated_at: string;
    html_url: string;
}

export interface GitHubAppStatus {
    installed: boolean;
    installation_id?: number | null;
}

export interface IndexingProgress {
    project_id: string;
    status: 'pending' | 'scanning' | 'analyzing' | 'completed' | 'error';
    progress: number;
    current_file: string | null;
    processed_files: number;
    total_files: number;
    message: string | null;
}

export interface Issue {
    id: string;
    project_id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'security' | 'performance' | 'bug' | 'style';
    file_path: string;
    line_number: number;
    suggestion: string;
    auto_fixable: boolean;
    status: 'open' | 'fixed' | 'ignored';
    created_at: string;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any;
        request_id?: string;
    };
}