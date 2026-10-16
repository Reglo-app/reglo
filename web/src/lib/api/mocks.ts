// Fictitious data used while the API endpoints do not exist yet.
// No real person or company: names are invented.

import type { CurrentUser, DashboardSummary } from "./types";

export const mockCurrentUser: CurrentUser = {
    id: "0192f0c4-7a3e-7c3a-9b1e-5d2a1c000001",
    email: "camille.martin@atelier-demo.test",
    firstName: "Camille",
    lastName: "Martin",
    role: "admin",
    organization: {
        id: "0192f0c4-7a3e-7c3a-9b1e-5d2a1c0000a1",
        name: "Atelier Démo",
    },
};

export const mockDashboardSummary: DashboardSummary = {
    globalScore: 64,
    domains: [
        { domain: "quality", score: 72, previousScore: 65 },
        { domain: "hygiene", score: 58, previousScore: 60 },
        { domain: "safety", score: 49, previousScore: null },
        { domain: "environment", score: 77, previousScore: 70 },
    ],
    lastDiagnosticAt: "2026-10-01T09:00:00.000Z",
};
