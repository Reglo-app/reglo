import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

import { DomainTabs } from "./domain-tabs";

export const metadata: Metadata = { title: "Tableau de bord" };

function DomainTabsFallback() {
    return <Skeleton className="h-11 w-full max-w-xl" />;
}

export default function DashboardPage() {
    return (
        <>
            <PageHeader
                title="Tableau de bord"
                description="Votre situation sur les quatre domaines QHSE."
            />
            {/* The tabs read the URL: render them on the client only. */}
            <Suspense fallback={<DomainTabsFallback />}>
                <DomainTabs />
            </Suspense>
        </>
    );
}
