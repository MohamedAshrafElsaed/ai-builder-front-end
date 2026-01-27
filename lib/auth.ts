export interface User {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    // Add other fields as returned by backend
}

export interface AuthSession {
    access_token: string;
    token_type: string;
    user: User;
    personal_team?: any;
}

const TOKEN_KEY = "access_token";
const SESSION_KEY = "auth_session";

class AuthService {
    // Get the token from cookies (for middleware/server compatibility ideally, but here using document.cookie for client)
    getAccessToken(): string | null {
        if (typeof window === "undefined") return null;
        const match = document.cookie.match(new RegExp("(^| )" + TOKEN_KEY + "=([^;]+)"));
        return match ? match[2] : null;
    }

    getAuthHeader(): string | null {
        const token = this.getAccessToken();
        return token ? `Bearer ${token}` : null;
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    // Persist session
    setSession(session: AuthSession) {
        if (typeof window === "undefined") return;

        // Set cookie for token (expires in 7 days)
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `${TOKEN_KEY}=${session.access_token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

        // Store full session details in localStorage for UI access
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    getSession(): AuthSession | null {
        if (typeof window === "undefined") return null;
        const data = localStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    }

    // Login redirects to backend
    login() {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/auth/github`;
    }

    logout() {
        if (typeof window === "undefined") return;
        document.cookie = `${TOKEN_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "/";
    }
}

export const authService = new AuthService();
