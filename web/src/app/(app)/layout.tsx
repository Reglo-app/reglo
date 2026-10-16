import NextTopLoader from "nextjs-toploader";

import { AppShell } from "@/components/shell/app-shell";

// Placeholder user until the mock data layer is wired.
const user = {
    fullName: "Camille Martin",
    roleLabel: "Administratrice",
    organizationName: "Atelier Démo",
};

export default function AppLayout({ children }: LayoutProps<"/">) {
    return (
        <>
            {/* Charter: thin 3px brand-green bar on every page change. */}
            <NextTopLoader
                color="var(--color-brand-green)"
                height={3}
                showSpinner={false}
                shadow={false}
            />
            <AppShell user={user}>{children}</AppShell>
        </>
    );
}
