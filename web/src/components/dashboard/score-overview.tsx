import Link from "next/link";
import {
    ChevronRight,
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
import { DOMAIN_ICON_CLASSES, DOMAINS, type DomainKey } from "@/lib/domains";
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
}: {
    score: number;
    previousScore: number | null;
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

// --- Global score ring -----------------------------------------------------

const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Progress circle drawn in white, the score in the middle. */
function ScoreRing({ score }: { score: number }) {
    const clamped = Math.min(100, Math.max(0, score));
    return (
        <div
            role="img"
            aria-label={`Score global : ${score} sur 100`}
            className="relative size-40 shrink-0"
        >
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-white/25"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - clamped / 100)}
                    className="stroke-white"
                />
            </svg>
            <span
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center"
            >
                <span className="text-5xl leading-none font-semibold">
                    {score}
                </span>
                <span className="text-sm text-white/85">/ 100</span>
            </span>
        </div>
    );
}

// --- Detailed list ----------------------------------------------------------

const BAR_CLASSES: Record<DomainKey, string> = {
    quality: "bg-quality",
    hygiene: "bg-hygiene",
    safety: "bg-safety",
    environment: "bg-environment",
};

/** One QHSE pillar: name, score, trend and a bar in its colour. */
function DomainTile(score: DomainScore) {
    const { label, icon: Icon } = DOMAINS[score.domain];
    return (
        <li className="flex">
            <Link
                href={`/domains/${score.domain}`}
                className="group flex flex-1 flex-col justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-border-strong hover:bg-green-50"
            >
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Icon
                        aria-hidden="true"
                        className={cn(
                            "size-5 shrink-0",
                            DOMAIN_ICON_CLASSES[score.domain],
                        )}
                    />
                    <span className="flex-1">{label}</span>
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                    />
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
        </li>
    );
}

/** Block 1, "Où en suis-je ?": global score ring on the left, pillars in a 2 × 2 grid. */
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

    const globalScore = summary.globalScore;
    const delta =
        summary.previousGlobalScore === null
            ? null
            : globalScore - summary.previousGlobalScore;

    return (
        <Card>
            <BlockHeader icon={Gauge} title="Score QHSE" />
            <CardContent className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                {/* Global score: ring on the brand gradient. */}
                <div className="relative isolate flex flex-col items-center justify-center gap-3 overflow-hidden rounded-lg bg-brand-gradient p-6 text-white">
                    <span
                        aria-hidden="true"
                        className="absolute -top-14 -right-14 -z-10 size-44 rounded-full bg-white/10"
                    />
                    <span className="text-sm font-semibold">Score global</span>
                    <ScoreRing score={globalScore} />
                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                        {scoreLevel(globalScore)}
                    </span>
                    {delta !== null && (
                        <span className="flex items-center gap-1 text-sm font-medium">
                            {delta >= 0 ? (
                                <TrendingUp
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            ) : (
                                <TrendingDown
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            )}
                            {delta >= 0 ? "+" : "−"}
                            {Math.abs(delta)}
                            <span className="sr-only">
                                {" "}
                                points depuis le diagnostic précédent
                            </span>
                        </span>
                    )}
                </div>

                {/* Detailed scores: the four pillars in a 2 × 2 grid that
                    fills the height of the global score panel. */}
                <ul className="grid gap-3 sm:grid-cols-2 sm:grid-rows-2">
                    {summary.domains.map((score) => (
                        <DomainTile key={score.domain} {...score} />
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
