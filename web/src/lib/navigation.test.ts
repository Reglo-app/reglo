import { describe, expect, it } from "vitest";

import {
    HOME_ITEM,
    NAV_ITEMS,
    findNavEntry,
    findNavItem,
    getBreadcrumb,
    isActive,
} from "@/lib/navigation";

describe("isActive", () => {
    it("matches the page and its sub-pages only", () => {
        const item = { href: "/actions" };
        expect(isActive(item, "/actions")).toBe(true);
        expect(isActive(item, "/actions/42")).toBe(true);
        expect(isActive(item, "/actions-archive")).toBe(false);
    });
});

describe("navigation tree", () => {
    it("puts Diagnostic under Tableau de bord, not at the top level", () => {
        expect(HOME_ITEM.children?.map((c) => c.label)).toEqual(["Diagnostic"]);
        expect(NAV_ITEMS.map((item) => item.label)).not.toContain("Diagnostic");
    });

    it("maps a sub-page to its parent branch", () => {
        const entry = findNavEntry("/diagnostic");
        expect(entry?.isChild).toBe(true);
        expect(entry?.item).toBe(HOME_ITEM);
        expect(findNavItem("/diagnostic")).toBe(HOME_ITEM);
    });

    it("prefers the QHSE domain over the dashboard", () => {
        expect(findNavItem("/dashboard/safety")?.label).toBe("Sécurité");
        expect(findNavItem("/dashboard")?.label).toBe("Tableau de bord");
    });
});

describe("getBreadcrumb", () => {
    it("has only the home crumb on the dashboard", () => {
        expect(getBreadcrumb("/dashboard").map((c) => c.label)).toEqual([
            "Tableau de bord",
        ]);
    });

    it("adds the section, with its icon, after the home crumb", () => {
        const crumbs = getBreadcrumb("/actions");
        expect(crumbs.map((c) => c.label)).toEqual([
            "Tableau de bord",
            "Plan d'actions",
        ]);
        expect(crumbs.every((c) => c.icon)).toBe(true);
    });

    it("shows a sub-page of the home branch after the home crumb", () => {
        expect(getBreadcrumb("/diagnostic").map((c) => c.label)).toEqual([
            "Tableau de bord",
            "Diagnostic",
        ]);
    });

    it("gives a domain page a home + domain breadcrumb", () => {
        expect(getBreadcrumb("/dashboard/hygiene").map((c) => c.label)).toEqual(
            ["Tableau de bord", "Hygiène-Santé"],
        );
    });

    it("adds a detail crumb for a sub-page", () => {
        expect(getBreadcrumb("/actions/42").map((c) => c.href)).toEqual([
            "/dashboard",
            "/actions",
            "/actions/42",
        ]);
    });

    it("falls back to the home crumb for an unknown path", () => {
        expect(getBreadcrumb("/unknown")).toHaveLength(1);
    });
});
