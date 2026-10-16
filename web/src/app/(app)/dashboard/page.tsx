import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";

import {
    AlertsCard,
    NewsCard,
    UpcomingActionsCard,
} from "@/components/dashboard/dashboard-lists";
import { ScoreOverview } from "@/components/dashboard/score-overview";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Tableau de bord" };

/**
 * Home page: four blocks, each answering one question (score, alerts,
 * next actions, regulatory news). Kept short on purpose.
 */
async function DashboardContent() {
    const summary = await api.getDashboardSummary();
    const today = summary.generatedAt;

    return (
        <div className="flex flex-col gap-4">
            <ScoreOverview summary={summary} />
            <div className="grid gap-4 xl:grid-cols-3">
                <AlertsCard alerts={summary.alerts} today={today} />
                <UpcomingActionsCard
                    actions={summary.upcomingActions}
                    onTimeRate={summary.actionsOnTimeRate}
                    today={today}
                />
                <NewsCard news={summary.latestNews} />
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-4" aria-busy="true">
            <span className="sr-only">Chargement…</span>
            <Skeleton className="h-44 rounded-lg" />
            <div className="grid gap-4 xl:grid-cols-3">
                <Skeleton className="h-64 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <>
            <PageHeader
                title="Tableau de bord"
                description="Votre situation sur les quatre domaines QHSE."
                action={
                    <Button asChild>
                        <Link href="/diagnostic">
                            <Plus aria-hidden="true" />
                            Faire un diagnostic
                        </Link>
                    </Button>
                }
            />
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent />
            </Suspense>
        </>
    );
}
