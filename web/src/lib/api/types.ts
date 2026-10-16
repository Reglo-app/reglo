// Shapes of the data returned by the REGLO API (Symfony / API Platform).
// Keep them in sync with the API resources when the endpoints are built.

import type { DomainKey } from "@/lib/domains";

export type RoleKey = "admin" | "member" | "reader";

export const ROLE_LABELS: Record<RoleKey, string> = {
    admin: "Administrateur",
    member: "Membre",
    reader: "Lecteur",
};

export type Organization = {
    id: string;
    name: string;
};

/** `GET /api/me`: the signed-in user and their organization (US-02). */
export type CurrentUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: RoleKey;
    organization: Organization;
};

/** Score of one QHSE domain, from 0 to 100 (DATA-01 / US-06). */
export type DomainScore = {
    domain: DomainKey;
    score: number;
    /** Score of the previous diagnostic, if any. */
    previousScore: number | null;
};

export type DashboardSummary = {
    globalScore: number;
    domains: DomainScore[];
    /** ISO 8601 date of the last diagnostic, or null if none yet. */
    lastDiagnosticAt: string | null;
};
