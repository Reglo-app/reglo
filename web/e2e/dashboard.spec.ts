import { expect, test } from "@playwright/test";

test("dashboard keeps the selected QHSE domain in the URL", async ({
    page,
}) => {
    await page.goto("/dashboard");
    const tabs = page.getByRole("tablist", { name: "Domaines QHSE" });
    await expect(tabs.getByRole("tab")).toHaveCount(4);

    await tabs.getByRole("tab", { name: "Sécurité" }).click();
    await expect(page).toHaveURL(/domain=safety/);

    await page.reload();
    await expect(page.getByRole("tab", { name: "Sécurité" })).toHaveAttribute(
        "aria-selected",
        "true",
    );
});
