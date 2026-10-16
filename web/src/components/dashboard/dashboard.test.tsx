import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    AlertsCard,
    NewsCard,
    UpcomingActionsCard,
} from "@/components/dashboard/dashboard-lists";
import { ScoreOverview } from "@/components/dashboard/score-overview";
import { mockDashboardSummary } from "@/lib/api/mocks";

const summary = mockDashboardSummary;
const today = summary.generatedAt;

describe("ScoreOverview", () => {
    it("shows the global score and links each domain to its page", () => {
        render(<ScoreOverview summary={summary} />);
        expect(screen.getByText("Score global")).toBeInTheDocument();
        expect(screen.getByText("64")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Sécurité/ })).toHaveAttribute(
            "href",
            "/dashboard/safety",
        );
        expect(screen.getAllByRole("link")).toHaveLength(4);
    });

    it("says the trend in words, not only with colour", () => {
        render(<ScoreOverview summary={summary} />);
        const quality = screen.getByRole("link", { name: /Qualité/ });
        expect(quality).toHaveTextContent(
            "+7 points depuis le diagnostic précédent",
        );
        expect(
            screen.getByRole("link", { name: /Sécurité/ }),
        ).toHaveTextContent("Premier diagnostic");
    });

    it("asks for a first diagnostic when there is no score", () => {
        render(
            <ScoreOverview
                summary={{ ...summary, globalScore: null, domains: [] }}
            />,
        );
        expect(screen.getByRole("link", { name: "Commencer" })).toHaveAttribute(
            "href",
            "/diagnostic",
        );
    });
});

describe("AlertsCard", () => {
    it("lists alerts with a due label and a domain", () => {
        render(<AlertsCard alerts={summary.alerts} today={today} />);
        const items = screen.getAllByRole("listitem");
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveTextContent("Mettre à jour le DUERP");
        expect(items[0]).toHaveTextContent("En retard de 6 jours");
        expect(items[0]).toHaveTextContent("Sécurité");
    });

    it("never shows more than 5 alerts", () => {
        const many = Array.from({ length: 8 }, (_, i) => ({
            ...summary.alerts[0],
            id: `a${i}`,
        }));
        render(<AlertsCard alerts={many} today={today} />);
        expect(screen.getAllByRole("listitem")).toHaveLength(5);
    });

    it("has a reassuring empty state", () => {
        render(<AlertsCard alerts={[]} today={today} />);
        expect(screen.getByText("Rien d'urgent.")).toBeInTheDocument();
    });
});

describe("UpcomingActionsCard", () => {
    it("shows the on-time rate and the next actions", () => {
        render(
            <UpcomingActionsCard
                actions={summary.upcomingActions}
                onTimeRate={78}
                today={today}
            />,
        );
        expect(screen.getByText("78 % à l'heure")).toBeInTheDocument();
        const first = screen.getAllByRole("listitem")[0];
        expect(first).toHaveTextContent("Planifier l'audit interne ISO 9001");
        expect(first).toHaveTextContent("Qualité");
        expect(first).toHaveTextContent("Dans 4 jours");
    });
});

describe("NewsCard", () => {
    it("shows at most three news items with their date", () => {
        render(<NewsCard news={summary.latestNews} />);
        expect(screen.getAllByRole("listitem")).toHaveLength(3);
        expect(screen.getByText("12 oct. 2026")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Tout voir/ })).toHaveAttribute(
            "href",
            "/news",
        );
    });
});
