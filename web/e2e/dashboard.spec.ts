import { expect, test } from "@playwright/test";

test("opens a QHSE domain page from the sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.getByRole("navigation", {
        name: "Navigation principale",
    });

    await sidebar.getByRole("link", { name: "Sécurité" }).click();

    await expect(page).toHaveURL(/\/dashboard\/safety$/);
    await expect(
        page.getByRole("heading", { level: 1, name: "Sécurité" }),
    ).toBeVisible();
    await expect(
        sidebar.getByRole("link", { name: "Sécurité" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
        page
            .getByRole("navigation", { name: "Fil d'Ariane" })
            .getByRole("link", { name: "Tableau de bord" }),
    ).toBeVisible();
});

test("shows a French not found page for an unknown domain", async ({
    page,
}) => {
    await page.goto("/dashboard/finance");
    await expect(
        page.getByRole("heading", { level: 1, name: "Page introuvable" }),
    ).toBeVisible();
});

test("shows a French not found page for an unknown url", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
        page.getByRole("heading", { level: 1, name: "Page introuvable" }),
    ).toBeVisible();
});
