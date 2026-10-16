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

// --- Concentric arcs -------------------------------------------------------

/** Arcs cover 270°, open at the bottom (inspiration captures 6 and 7). */
const ARC_SWEEP = 0.75;
/** Rotation so the arc starts bottom-left and ends bottom-right. */
const ARC_START = 135;
/** One gradient on the page: the global arc. */
const GLOBAL_GRADIENT_ID = "score-global-gradient";

const ARC_CLASSES: Record<DomainKey, string> = {
    quality: "stroke-quality",
    hygiene: "stroke-hygiene",
    safety: "stroke-safety",
    environment: "stroke-environment",
};

function Arc({
    radius,
    width,
    score,
    className,
    stroke,
}: {
    radius: number;
    width: number;
    score: number;
    className?: string;
    stroke?: string;
}) {
    const length = 2 * Math.PI * radius;
    const track = length * ARC_SWEEP;
    const value = (track * Math.min(100, Math.max(0, score))) / 100;
    const common = {
        cx: 100,
        cy: 100,
        r: radius,
        fill: "none",
        strokeWidth: width,
        strokeLinecap: "round" as const,
        transform: `rotate(${ARC_START} 100 100)`,
    };
    return (
        <>
            <circle
                {...common}
                strokeDasharray={`${track} ${length}`}
                className="stroke-teal-50"
            />
            {value > 0 && (
                <circle
                    {...common}
                    strokeDasharray={`${value} ${length}`}
                    stroke={stroke}
                    className={className}
                />
            )}
        </>
    );
}

/**
 * Big chart: the global score on the outer arc (brand gradient), one inner
 * arc per QHSE domain in its colour, the global score in the middle.
 */
function ScoreRings({
    globalScore,
    domains,
}: {
    globalScore: number;
    domains: DomainScore[];
}) {
    const label = [
        `Score global : ${globalScore} sur 100`,
        ...domains.map((d) => `${DOMAINS[d.domain].label} : ${d.score}`),
    ].join(". ");

    return (
        <div
            role="img"
            aria-label={label}
            className="relative size-60 shrink-0"
        >
            <svg viewBox="0 0 200 200" className="size-full">
                <defs>
                    <linearGradient
                        id={GLOBAL_GRADIENT_ID}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                    >
                        <stop offset="0" stopColor="var(--color-teal-700)" />
                        <stop offset="1" stopColor="var(--color-brand-green)" />
                    </linearGradient>
                </defs>
                <Arc
                    radius={90}
                    width={12}
                    score={globalScore}
                    stroke={`url(#${GLOBAL_GRADIENT_ID})`}
                />
                {domains.map((d, index) => (
                    <Arc
                        key={d.domain}
                        radius={73 - index * 10}
                        width={7}
                        score={d.score}
                        className={ARC_CLASSES[d.domain]}
                    />
                ))}
            </svg>
            <span
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center"
            >
                <span className="text-4xl leading-none font-semibold text-ink">
                    {globalScore}
                </span>
                <span className="text-xs text-ink-muted">/ 100</span>
            </span>
        </div>
    );
}

// --- Detailed list ----------------------------------------------------------

function DomainRow(score: DomainScore) {
    const { label, icon: Icon } = DOMAINS[score.domain];
    return (
        <li>
            <Link
                href={`/dashboard/${score.domain}`}
                className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-green-50"
            >
                <Icon
                    aria-hidden="true"
                    className={cn(
                        "size-5 shrink-0",
                        DOMAIN_ICON_CLASSES[score.domain],
                    )}
                />
                <span className="flex-1 text-sm font-medium text-ink">
                    {label}
                </span>
                <Trend
                    score={score.score}
                    previousScore={score.previousScore}
                />
                <span className="w-10 text-right text-lg font-semibold text-ink">
                    {score.score}
                    <span className="sr-only"> sur 100</span>
                </span>
                <ChevronRight
                    aria-hidden="true"
                    className="size-4 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
            </Link>
        </li>
    );
}

/** Block 1, "Où en suis-je ?": rings chart on the left, scores on the right. */
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
            <CardContent className="grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
                <div className="flex justify-center">
                    <ScoreRings
                        globalScore={globalScore}
                        domains={summary.domains}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    {/* Global score row: highlighted with the brand gradient. */}
                    <div className="flex items-center gap-3 rounded-lg bg-brand-gradient px-3 py-3 text-white">
                        <Gauge aria-hidden="true" className="size-5 shrink-0" />
                        <span className="flex-1 text-sm font-semibold">
                            Score global
                        </span>
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                            {scoreLevel(globalScore)}
                        </span>
                        <span className="w-10 text-right text-2xl font-semibold">
                            {globalScore}
                            <span className="sr-only"> sur 100</span>
                        </span>
                        <span className="w-4" aria-hidden="true" />
                    </div>
                    {summary.previousGlobalScore !== null && (
                        <p className="px-3 text-xs text-ink-muted">
                            {globalScore - summary.previousGlobalScore >= 0
                                ? "+"
                                : "−"}
                            {Math.abs(
                                globalScore - summary.previousGlobalScore,
                            )}{" "}
                            points depuis le diagnostic précédent
                        </p>
                    )}
                    <ul className="flex flex-col">
                        {summary.domains.map((score) => (
                            <DomainRow key={score.domain} {...score} />
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
