import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
    return (
        <PageHeader
            title="Tableau de bord"
            description="Votre situation sur les quatre domaines QHSE."
        />
    );
}
