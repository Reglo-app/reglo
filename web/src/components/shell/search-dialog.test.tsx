import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SearchDialog } from "@/components/shell/search-dialog";

describe("SearchDialog", () => {
    it("opens a search popup with a focused field on click", async () => {
        const user = userEvent.setup();
        render(<SearchDialog />);

        await user.click(screen.getByRole("button", { name: "Rechercher" }));

        expect(
            screen.getByRole("dialog", { name: "Rechercher" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("searchbox", { name: "Rechercher dans REGLO" }),
        ).toHaveFocus();
    });

    it("opens with Ctrl+K and closes with Escape", async () => {
        const user = userEvent.setup();
        render(<SearchDialog />);

        await user.keyboard("{Control>}k{/Control}");
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
