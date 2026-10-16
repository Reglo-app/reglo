import Link from "next/link";
import {
    ClipboardCheck,
    Gauge,
    LayoutGrid,
    Minus,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

import { BlockHeader } from "@/components/dashboard/block";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardSummary, DomainScore } from "@/lib/api";
import { DOMAIN_ICON_CLASSES, DOMAINS, type DomainKey } from "@/lib/domains";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Words for a score, so the level is never given by a number alone. */
export function scoreLevel(score: number): string {
    if (score >= 75) return "Maîtrisé";
    if (score >= 50) return "En progrès";
    return "À renforcer";
}

/** Change since the previous diagnostic: arrow + number, words for screen readers. */
function Trend({
    score,
    previousScore,
    className,
}: {
    score: number;
    previousScore: number | null;
    className?: string;
}) {
    if (previousScore === null) {
        return <span className="sr-only">Premier diagnostic</span>;
    }
    const delta = score - previousScore;
    const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    return (
        <span
            className={cn(
                "flex items-center gap-1 text-sm font-medium",
                className ??
                    cn(
                        delta > 0 && "text-green-700",
                        delta < 0 && "text-danger-700",
                        delta === 0 && "text-ink-muted",
                    ),
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

const GAUGE_TICKS = 48;

/**
 * Segmented gauge (inspiration capture 6): one tick per ~2 points, filled
 * ticks in white, the rest faded. The score sits in the middle.
 */
function ScoreGauge({ score }: { score: number }) {
    const filled = Math.round(
        (Math.min(100, Math.max(0, score)) / 100) * GAUGE_TICKS,
    );
    return (
        <div
            role="img"
            aria-label={`Score global : ${score} sur 100`}
            className="relative size-44 shrink-0"
        >
            <svg viewBox="0 0 100 100" className="size-full">
                {Array.from({ length: GAUGE_TICKS }, (_, index) => (
                    <line
                        key={index}
                        x1="50"
                        y1="3"
                        x2="50"
                        y2="12"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        transform={`rotate(${(index * 360) / GAUGE_TICKS} 50 50)`}
                        className={
                            index < filled ? "stroke-white" : "stroke-white/25"
                        }
                    />
                ))}
            </svg>
            <span
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center"
            >
                <span className="text-5xl leading-none font-semibold">
                    {score}
                </span>
                <span className="text-sm text-white/80">/ 100</span>
            </span>
        </div>
    );
}

/** Hero card: the global score, its level and its trend. */
function GlobalScoreCard({ summary }: { summary: DashboardSummary }) {
    const score = summary.globalScore ?? 0;
    return (
        <Card tone="brand" className="relative isolate">
            {/* Decorative circles (inspiration captures 1 and 2). */}
            <span
                aria-hidden="true"
                className="absolute -top-16 -right-16 -z-10 size-56 rounded-full bg-white/10"
            />
            <span
                aria-hidden="true"
                className="absolute -right-6 -bottom-20 -z-10 size-40 rounded-full bg-white/5"
            />
            <CardContent className="flex h-full flex-col gap-4">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Gauge aria-hidden="true" className="size-5" />
                        Score global
                    </h2>
                    {summary.lastDiagnosticAt && (
                        <p className="text-sm text-white/85">
                            Diagnostic du {formatDate(summary.lastDiagnosticAt)}
                        </p>
                    )}
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <ScoreGauge score={score} />
                    <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                        {scoreLevel(score)}
                    </span>
                    <Trend
                        score={score}
                        previousScore={summary.previousGlobalScore}
                        className="text-white"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

const BAR_CLASSES: Record<DomainKey, string> = {
    quality: "bg-quality",
    hygiene: "bg-hygiene",
    safety: "bg-safety",
    environment: "bg-environment",
};

function DomainTile(score: DomainScore) {
    const { label, icon: Icon } = DOMAINS[score.domain];
    return (
        <Link
            href={`/dashboard/${score.domain}`}
            className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 transition-colors hover:border-border-strong hover:bg-green-50"
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
                <Trend
                    score={score.score}
                    previousScore={score.previousScore}
                />
            </span>
            {/* Decorative: the number above says the same thing. */}
            <span
                aria-hidden="true"
                className="h-1.5 overflow-hidden rounded-full bg-surface-subtle"
            >
                <span
                    className={cn(
                        "block h-full rounded-full",
                        BAR_CLASSES[score.domain],
                    )}
                    style={{ width: `${score.score}%` }}
                />
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
        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
            <GlobalScoreCard summary={summary} />
            <Card>
                <BlockHeader icon={LayoutGrid} title="Par domaine" />
                <CardContent className="grid gap-3 sm:grid-cols-2">
                    {summary.domains.map((score) => (
                        <DomainTile key={score.domain} {...score} />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
