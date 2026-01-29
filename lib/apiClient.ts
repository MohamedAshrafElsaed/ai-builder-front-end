import { authService } from "./auth";

interface RequestOptions extends RequestInit {
    timeout?: number;
    token?: string;
    query?: Record<string, string | number | boolean>;
}

export interface ApiError {
    status: number;
    code: string;
    message: string;
    details?: any;
    request_id?: string;
}

class ApiClient {
    private baseURL: string;
    private defaultTimeout: number;

    constructor(config: { baseURL: string; timeout?: number }) {
        this.baseURL = config.baseURL.replace(/\/$/, "");
        this.defaultTimeout = config.timeout || 10000;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { timeout = this.defaultTimeout, token: explicitToken, query, ...fetchOptions } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        // Build URL without adding trailing slash
        let url = `${this.baseURL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

        // Add query params if provided
        if (query) {
            const searchParams = new URLSearchParams();
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += (url.includes('?') ? '&' : '?') + queryString;
            }
        }

        const headers = new Headers({
            "Content-Type": "application/json",
            Accept: "application/json",
            ...options.headers,
        });

        // Inject Auth
        const authToken = explicitToken || authService.getAccessToken();
        if (authToken) {
            headers.set("Authorization", `Bearer ${authToken}`);
        }

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const errorBody = data.error || data.detail || {};

                const error: ApiError = {
                    status: response.status,
                    code: errorBody.code || "UNKNOWN_ERROR",
                    message: typeof errorBody === 'string' ? errorBody : (errorBody.message || response.statusText),
                    details: errorBody.details || data,
                    request_id: errorBody.request_id
                };
                throw error;
            }

            if (response.status === 204) {
                return {} as T;
            }

            return await response.json();
        } catch (error: any) {
            if (error.name === "AbortError") {
                throw { status: 408, code: "TIMEOUT", message: "Request timed out" };
            }
            throw error;
        } finally {
            clearTimeout(id);
        }
    }

    get<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "GET" });
    }

    post<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) });
    }

    put<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) });
    }

    patch<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) });
    }

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "DELETE" });
    }
}

export const apiClient = new ApiClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
});