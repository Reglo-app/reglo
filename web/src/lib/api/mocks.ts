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
    generatedAt: "2026-10-16T08:00:00.000Z",
    globalScore: 64,
    domains: [
        { domain: "quality", score: 72, previousScore: 65 },
        { domain: "hygiene", score: 58, previousScore: 60 },
        { domain: "safety", score: 49, previousScore: null },
        { domain: "environment", score: 77, previousScore: 70 },
    ],
    lastDiagnosticAt: "2026-10-01T09:00:00.000Z",
    alerts: [
        {
            id: "alert-1",
            kind: "action_overdue",
            title: "Mettre à jour le DUERP",
            domain: "safety",
            dueDate: "2026-10-10T00:00:00.000Z",
        },
        {
            id: "alert-2",
            kind: "training_expiring",
            title: "Habilitation électrique de L. Bernard",
            domain: "safety",
            dueDate: "2026-10-28T00:00:00.000Z",
        },
        {
            id: "alert-3",
            kind: "document_expiring",
            title: "Contrat d'enlèvement des déchets",
            domain: "environment",
            dueDate: "2026-11-05T00:00:00.000Z",
        },
        {
            id: "alert-4",
            kind: "action_overdue",
            title: "Afficher le protocole de nettoyage des vestiaires",
            domain: "hygiene",
            dueDate: "2026-10-14T00:00:00.000Z",
        },
    ],
    upcomingActions: [
        {
            id: "action-1",
            title: "Planifier l'audit interne ISO 9001",
            domain: "quality",
            ownerName: "Camille Martin",
            dueDate: "2026-10-20T00:00:00.000Z",
            status: "in_progress",
        },
        {
            id: "action-2",
            title: "Vérifier les extincteurs de l'atelier",
            domain: "safety",
            ownerName: "Léo Bernard",
            dueDate: "2026-10-24T00:00:00.000Z",
            status: "todo",
        },
        {
            id: "action-3",
            title: "Installer un bac de tri pour les métaux",
            domain: "environment",
            ownerName: "Inès Moreau",
            dueDate: "2026-10-31T00:00:00.000Z",
            status: "todo",
        },
        {
            id: "action-4",
            title: "Former l'équipe aux gestes et postures",
            domain: "hygiene",
            ownerName: "Camille Martin",
            dueDate: "2026-11-12T00:00:00.000Z",
            status: "todo",
        },
    ],
    actionsOnTimeRate: 78,
    latestNews: [
        {
            id: "news-1",
            title: "Vérifications périodiques des équipements de travail : nouvel arrêté",
            domain: "safety",
            publishedAt: "2026-10-12T00:00:00.000Z",
        },
        {
            id: "news-2",
            title: "Tri à la source des biodéchets : rappel des obligations",
            domain: "environment",
            publishedAt: "2026-10-08T00:00:00.000Z",
        },
        {
            id: "news-3",
            title: "Réclamations clients : délais de réponse recommandés",
            domain: "quality",
            publishedAt: "2026-10-02T00:00:00.000Z",
        },
    ],
};
