import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DomainTabs } from "./domain-tabs";

const navigation = vi.hoisted(() => ({
    search: "",
    replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/dashboard",
    useRouter: () => ({ replace: navigation.replace }),
    useSearchParams: () => new URLSearchParams(navigation.search),
}));

beforeEach(() => {
    navigation.search = "";
    navigation.replace.mockClear();
});

describe("DomainTabs", () => {
    it("shows the four QHSE domains, Qualité selected by default", () => {
        render(<DomainTabs />);
        const tabs = screen.getAllByRole("tab");
        expect(tabs.map((tab) => tab.textContent)).toEqual([
            "Qualité",
            "Hygiène-Santé",
            "Sécurité",
            "Environnement",
        ]);
        expect(screen.getByRole("tab", { name: "Qualité" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
    });

    it("selects the domain given in the URL", () => {
        navigation.search = "domain=environment";
        render(<DomainTabs />);
        expect(
            screen.getByRole("tab", { name: "Environnement" }),
        ).toHaveAttribute("aria-selected", "true");
    });

    it("ignores an unknown domain in the URL", () => {
        navigation.search = "domain=finance";
        render(<DomainTabs />);
        expect(screen.getByRole("tab", { name: "Qualité" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
    });

    it("writes the selected domain in the URL", async () => {
        const user = userEvent.setup();
        render(<DomainTabs />);
        await user.click(screen.getByRole("tab", { name: "Sécurité" }));
        expect(navigation.replace).toHaveBeenCalledWith(
            "/dashboard?domain=safety",
            { scroll: false },
        );
    });
});
