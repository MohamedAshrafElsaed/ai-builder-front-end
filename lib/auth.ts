export interface User {
    id: string;
    username: string;
    name?: string;
    email: string | null;
    avatar_url?: string | null;
}

export interface AuthSession {
    access_token: string;
    token_type: string;
    user?: User;
    personal_team?: unknown;
}

const TOKEN_KEY = "access_token";
const SESSION_KEY = "auth_session";

class AuthService {
    getAccessToken(): string | null {
        if (typeof window === "undefined") return null;
        const match = document.cookie.match(new RegExp("(^| )" + TOKEN_KEY + "=([^;]+)"));
        const token = match ? match[2] : null;
        return token;
    }

    getAuthHeader(): string | null {
        const token = this.getAccessToken();
        return token ? `Bearer ${token}` : null;
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    setToken(token: string): void {
        if (typeof window === "undefined") return;

        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Set cookie
        const cookieValue = `${TOKEN_KEY}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        document.cookie = cookieValue;

        console.log("[AUTH] Token set, cookie length:", cookieValue.length);
        console.log("[AUTH] Verify token exists:", !!this.getAccessToken());
    }

    setSession(session: AuthSession): void {
        if (typeof window === "undefined") return;
        this.setToken(session.access_token);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    setUser(user: User): void {
        if (typeof window === "undefined") return;
        const token = this.getAccessToken();
        if (token) {
            const session: AuthSession = {
                access_token: token,
                token_type: "Bearer",
                user,
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
    }

    getSession(): AuthSession | null {
        if (typeof window === "undefined") return null;
        const data = localStorage.getItem(SESSION_KEY);
        if (!data) {
            // If we have a token but no session, create minimal session
            const token = this.getAccessToken();
            if (token) {
                return { access_token: token, token_type: "Bearer" };
            }
            return null;
        }
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    getUser(): User | null {
        return this.getSession()?.user || null;
    }

    clearSession(): void {
        if (typeof window === "undefined") return;
        document.cookie = `${TOKEN_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        localStorage.removeItem(SESSION_KEY);
    }

    login(): void {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        window.location.href = `${apiUrl}/auth/github`;
    }

    logout(): void {
        this.clearSession();
        window.location.href = "/";
    }
}

export const authService = new AuthService();