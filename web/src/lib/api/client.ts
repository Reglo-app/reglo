import { mockCurrentUser, mockDashboardSummary } from "./mocks";
import type { CurrentUser, DashboardSummary } from "./types";

/**
 * Mocks are used unless NEXT_PUBLIC_USE_MOCKS is "false". NEXT_PUBLIC_*
 * variables are inlined at build time. Switch the default once the API
 * endpoints exist (US-01, US-02, US-06).
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Error with the HTTP status. Never show `message` to users (rule 3). */
export class ApiError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: "include",
        headers: { Accept: "application/json", ...init?.headers },
    });

    if (!response.ok) {
        throw new ApiError(
            response.status,
            `${init?.method ?? "GET"} ${path} failed`,
        );
    }

    return (await response.json()) as T;
}

export type Api = {
    getCurrentUser(): Promise<CurrentUser>;
    getDashboardSummary(): Promise<DashboardSummary>;
};

const httpApi: Api = {
    getCurrentUser: () => request<CurrentUser>("/api/me"),
    getDashboardSummary: () => request<DashboardSummary>("/api/dashboard"),
};

// structuredClone: callers can never mutate the shared mock objects.
const mockApi: Api = {
    getCurrentUser: async () => structuredClone(mockCurrentUser),
    getDashboardSummary: async () => structuredClone(mockDashboardSummary),
};

export function createApi(useMocks: boolean = USE_MOCKS): Api {
    return useMocks ? mockApi : httpApi;
}

export const api = createApi();
