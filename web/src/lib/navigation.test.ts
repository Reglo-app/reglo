import { describe, expect, it } from "vitest";

import { HOME_ITEM, getBreadcrumb, isActive } from "@/lib/navigation";

describe("isActive", () => {
    it("matches the page and its sub-pages only", () => {
        const item = { ...HOME_ITEM, href: "/actions" };
        expect(isActive(item, "/actions")).toBe(true);
        expect(isActive(item, "/actions/42")).toBe(true);
        expect(isActive(item, "/actions-archive")).toBe(false);
    });
});

describe("getBreadcrumb", () => {
    it("has only the home crumb on the dashboard", () => {
        expect(getBreadcrumb("/dashboard").map((c) => c.label)).toEqual([
            "Tableau de bord",
        ]);
    });

    it("adds the section after the home crumb", () => {
        const crumbs = getBreadcrumb("/diagnostic");
        expect(crumbs.map((c) => c.label)).toEqual([
            "Tableau de bord",
            "Diagnostic",
        ]);
        expect(crumbs.every((c) => c.icon)).toBe(true);
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
