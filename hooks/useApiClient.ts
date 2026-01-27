import { apiClient } from "@/lib/apiClient";
import { useMemo } from "react";

export function useApiClient() {
    // Simple wrapper to maintain hook compatibility and allow future expansion
    return useMemo(() => ({
        get: apiClient.get.bind(apiClient),
        post: apiClient.post.bind(apiClient),
        put: apiClient.put.bind(apiClient),
        patch: apiClient.patch.bind(apiClient),
        delete: apiClient.delete.bind(apiClient),
    }), []);
}
