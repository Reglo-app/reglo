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
            className="flex flex-col justify-between gap-2 rounded-lg border border-border bg-white p-4 transition-colors hover:border-border-strong hover:bg-green-50"
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

const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Progress circle with the score in the middle (drawn in white). */
function ScoreRing({ score }: { score: number }) {
    const clamped = Math.min(100, Math.max(0, score));
    return (
        <div
            role="img"
            aria-label={`Score global : ${score} sur 100`}
            className="relative size-24 shrink-0"
        >
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="9"
                    className="stroke-white/25"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - clamped / 100)}
                    className="stroke-white"
                />
            </svg>
            <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center text-3xl font-semibold"
            >
                {score}
            </span>
        </div>
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
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="flex items-center gap-4 rounded-lg bg-brand-gradient p-4 text-white sm:col-span-2">
                    <ScoreRing score={summary.globalScore} />
                    <span className="text-base font-semibold">
                        Score global
                    </span>
                </div>
                {summary.domains.map((score) => (
                    <DomainTile key={score.domain} {...score} />
                ))}
            </CardContent>
        </Card>
    );
}
