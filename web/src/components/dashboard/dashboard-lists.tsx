import Link from "next/link";
import {
    CalendarClock,
    FileWarning,
    GraduationCap,
    type LucideIcon,
} from "lucide-react";

import { DomainBadge } from "@/components/domain-badge";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type {
    ActionSummary,
    AlertKind,
    DashboardAlert,
    NewsSummary,
} from "@/lib/api";
import { daysUntil, formatDate, formatDueIn } from "@/lib/format";
import { cn } from "@/lib/utils";

function SeeAll({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="rounded-md px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50"
        >
            Tout voir<span className="sr-only"> : {label}</span>
        </Link>
    );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
    return <p className="py-4 text-sm text-ink-muted">{children}</p>;
}

const ALERT_ICONS: Record<AlertKind, { icon: LucideIcon; label: string }> = {
    action_overdue: { icon: CalendarClock, label: "Action" },
    document_expiring: { icon: FileWarning, label: "Justificatif" },
    training_expiring: { icon: GraduationCap, label: "Habilitation" },
};

/** Block 2, "Qu'est-ce qui presse ?": late or expiring items, max 5. */
export function AlertsCard({
    alerts,
    today,
}: {
    alerts: DashboardAlert[];
    today: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2>Alertes</h2>
                </CardTitle>
                <CardAction>
                    <SeeAll href="/actions" label="alertes" />
                </CardAction>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <EmptyLine>Rien d&apos;urgent : tout est à jour.</EmptyLine>
                ) : (
                    <ul className="divide-y divide-border">
                        {alerts.slice(0, 5).map((alert) => {
                            const { icon: Icon, label } =
                                ALERT_ICONS[alert.kind];
                            const late = daysUntil(alert.dueDate, today) < 0;
                            return (
                                <li
                                    key={alert.id}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className={cn(
                                            "size-5 shrink-0",
                                            late
                                                ? "text-danger"
                                                : "text-yellow-800",
                                        )}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-ink">
                                            <span className="sr-only">
                                                {label} :{" "}
                                            </span>
                                            {alert.title}
                                        </p>
                                        <DomainBadge
                                            domain={alert.domain}
                                            className="mt-1"
                                        />
                                    </div>
                                    <Badge
                                        variant={
                                            late ? "destructive" : "warning"
                                        }
                                    >
                                        {formatDueIn(alert.dueDate, today)}
                                    </Badge>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

/** Block 3, "Que faire ensuite ?": next open actions and on-time rate. */
export function UpcomingActionsCard({
    actions,
    onTimeRate,
    today,
}: {
    actions: ActionSummary[];
    onTimeRate: number | null;
    today: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2>Prochaines actions</h2>
                </CardTitle>
                <CardAction>
                    <SeeAll href="/actions" label="plan d'actions" />
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {onTimeRate !== null && (
                    <p className="text-sm text-ink-muted">
                        <span className="text-lg font-semibold text-ink">
                            {onTimeRate} %
                        </span>{" "}
                        des actions clôturées dans les délais
                    </p>
                )}
                {actions.length === 0 ? (
                    <EmptyLine>Aucune action en cours.</EmptyLine>
                ) : (
                    <ul className="divide-y divide-border">
                        {actions.slice(0, 5).map((action) => (
                            <li
                                key={action.id}
                                className="flex items-center gap-3 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-ink">
                                        {action.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-ink-muted">
                                        {action.ownerName}
                                    </p>
                                </div>
                                <DomainBadge domain={action.domain} />
                                <span className="w-24 shrink-0 text-right text-xs text-ink-muted">
                                    {formatDueIn(action.dueDate, today)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

/** Block 4, "Qu'est-ce qui change pour moi ?": latest regulatory news. */
export function NewsCard({ news }: { news: NewsSummary[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2>Veille réglementaire</h2>
                </CardTitle>
                <CardAction>
                    <SeeAll href="/news" label="veille réglementaire" />
                </CardAction>
            </CardHeader>
            <CardContent>
                {news.length === 0 ? (
                    <EmptyLine>
                        Aucune nouveauté pour votre entreprise.
                    </EmptyLine>
                ) : (
                    <ul className="grid gap-3 md:grid-cols-3">
                        {news.slice(0, 3).map((item) => (
                            <li
                                key={item.id}
                                className="flex flex-col gap-2 rounded-lg border border-border p-4"
                            >
                                <DomainBadge domain={item.domain} />
                                <p className="text-sm font-medium text-ink">
                                    {item.title}
                                </p>
                                <p className="mt-auto text-xs text-ink-muted">
                                    {formatDate(item.publishedAt)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
