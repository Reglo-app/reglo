import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary, DomainScore } from "@/lib/api";
import { DOMAIN_ICON_CLASSES, DOMAINS } from "@/lib/domains";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function Trend({ score, previousScore }: DomainScore) {
    if (previousScore === null) {
        return (
            <span className="text-xs text-ink-muted">Premier diagnostic</span>
        );
    }
    const delta = score - previousScore;
    const label =
        delta === 0
            ? "Stable"
            : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} pts`;
    return (
        <span
            className={cn(
                "text-xs font-medium",
                delta > 0 && "text-green-700",
                delta < 0 && "text-danger-700",
                delta === 0 && "text-ink-muted",
            )}
        >
            {label}
            <span className="sr-only"> depuis le diagnostic précédent</span>
        </span>
    );
}

function DomainTile(score: DomainScore) {
    const { label, icon: Icon } = DOMAINS[score.domain];
    return (
        <Link
            href={`/dashboard/${score.domain}`}
            className="group flex flex-col gap-3 rounded-lg border border-border bg-white p-4 transition-colors hover:border-border-strong hover:bg-green-50"
        >
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon
                    aria-hidden="true"
                    className={cn("size-5", DOMAIN_ICON_CLASSES[score.domain])}
                />
                {label}
                <ArrowRight
                    aria-hidden="true"
                    className="ml-auto size-4 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
            </span>
            <span className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-ink">
                    {score.score}
                </span>
                <span className="text-sm text-ink-muted">/ 100</span>
            </span>
            <Trend {...score} />
        </Link>
    );
}

/** Block 1, "Où en suis-je ?": global score and one tile per QHSE domain. */
export function ScoreOverview({ summary }: { summary: DashboardSummary }) {
    if (summary.globalScore === null) {
        return (
            <Card tone="brand">
                <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <ClipboardCheck aria-hidden="true" className="size-10" />
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">
                            Faites votre premier diagnostic
                        </h2>
                        <p className="text-sm text-white/80">
                            Une vingtaine de minutes pour obtenir votre score
                            sur les quatre domaines QHSE.
                        </p>
                    </div>
                    <Button asChild variant="highlight">
                        <Link href="/diagnostic">Commencer</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2>Score QHSE</h2>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[200px_1fr]">
                <div className="flex flex-col justify-center gap-1 rounded-lg bg-brand-teal p-5 text-white">
                    <span className="text-sm text-white/80">Score global</span>
                    <span className="flex items-baseline gap-1">
                        <span className="text-5xl font-semibold">
                            {summary.globalScore}
                        </span>
                        <span className="text-white/80">/ 100</span>
                    </span>
                    {summary.lastDiagnosticAt && (
                        <span className="text-xs text-white/80">
                            Diagnostic du {formatDate(summary.lastDiagnosticAt)}
                        </span>
                    )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summary.domains.map((score) => (
                        <DomainTile key={score.domain} {...score} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
