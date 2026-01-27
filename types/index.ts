export interface Project {
    id: string;
    name: string;
    github_repo_id: number;
    repo_full_name: string;
    status: 'active' | 'indexing' | 'error' | 'pending';
    health_score: number | null;
    laravel_version: string | null;
    files_processed: number;
    total_files: number;
    last_indexed_at: string | null;
    created_at: string;
    updated_at: string;
    scan_progress?: number;
    scan_message?: string;
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
    status: 'pending' | 'scanning' | 'analyzing' | 'complete' | 'error';
    progress_percentage: number;
    current_file: string | null;
    files_processed: number;
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
