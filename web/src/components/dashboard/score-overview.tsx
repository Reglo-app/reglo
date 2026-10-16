import Link from "next/link";
import {
    ClipboardCheck,
    Gauge,
    Minus,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

import { BlockHeader } from "@/components/dashboard/block";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardSummary, DomainScore } from "@/lib/api";
import { DOMAIN_ICON_CLASSES, DOMAINS } from "@/lib/domains";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Change since the previous diagnostic: arrow + number, words for screen readers. */
function Trend({ score, previousScore }: DomainScore) {
    if (previousScore === null) {
        return <span className="sr-only">Premier diagnostic</span>;
    }
    const delta = score - previousScore;
    const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    return (
        <span
            className={cn(
                "flex items-center gap-1 text-sm font-medium",
                delta > 0 && "text-green-700",
                delta < 0 && "text-danger-700",
                delta === 0 && "text-ink-muted",
            )}
        >
            <Icon aria-hidden="true" className="size-4" />
            {delta > 0 ? "+" : delta < 0 ? "−" : ""}
            {Math.abs(delta)}
            <span className="sr-only">
                {" "}
                points depuis le diagnostic précédent
            </span>
        </span>
    );
}

function DomainTile(score: DomainScore) {
    const { label, icon: Icon } = DOMAINS[score.domain];
    return (
        <Link
            href={`/dashboard/${score.domain}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-white p-4 transition-colors hover:border-border-strong hover:bg-green-50"
        >
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon
                    aria-hidden="true"
                    className={cn("size-5", DOMAIN_ICON_CLASSES[score.domain])}
                />
                {label}
            </span>
            <span className="flex items-end justify-between gap-2">
                <span className="text-3xl font-semibold text-ink">
                    {score.score}
                    <span className="sr-only"> sur 100</span>
                </span>
                <Trend {...score} />
            </span>
        </Link>
    );
}

/** Block 1, "Où en suis-je ?": global score and one tile per QHSE domain. */
export function ScoreOverview({ summary }: { summary: DashboardSummary }) {
    if (summary.globalScore === null) {
        return (
            <Card tone="brand">
                <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <ClipboardCheck aria-hidden="true" className="size-8" />
                    <h2 className="flex-1 text-lg font-semibold">
                        Faites votre premier diagnostic
                    </h2>
                    <Button asChild variant="highlight">
                        <Link href="/diagnostic">Commencer</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <BlockHeader
                icon={Gauge}
                title="Score QHSE"
                extra={
                    summary.lastDiagnosticAt && (
                        <span className="text-sm font-normal text-ink-muted">
                            · {formatDate(summary.lastDiagnosticAt)}
                        </span>
                    )
                }
            />
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="flex flex-col justify-between gap-2 rounded-lg bg-brand-teal p-4 text-white sm:col-span-2 lg:col-span-1">
                    <span className="text-sm">Score global</span>
                    <span className="text-4xl font-semibold">
                        {summary.globalScore}
                        <span className="sr-only"> sur 100</span>
                    </span>
                </div>
                {summary.domains.map((score) => (
                    <DomainTile key={score.domain} {...score} />
                ))}
            </CardContent>
        </Card>
    );
}
