"use client";

import { useEffect, useState } from "react";
import { Bell, PanelLeft, Search } from "lucide-react";

import { AppBreadcrumb } from "@/components/shell/app-breadcrumb";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu, type UserMenuProps } from "@/components/shell/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "reglo.sidebar.collapsed";

type AppShellProps = {
    user: UserMenuProps;
    children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Restore the desktop sidebar state (per-browser preference).
    useEffect(() => {
        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from browser storage
            setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true");
        } catch {
            // Storage unavailable: keep the default.
        }
    }, []);

    function toggleCollapsed() {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem(COLLAPSED_KEY, String(next));
        } catch {
            // Storage unavailable: the state only lasts for this page.
        }
    }

    return (
        <div className="flex min-h-screen w-full">
            <a
                href="#main-content"
                className="sr-only z-50 rounded-md bg-brand-teal px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
            >
                Aller au contenu
            </a>

            {/* Desktop sidebar */}
            <aside
                id="app-sidebar"
                className={cn(
                    "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-white transition-[width] duration-200 lg:block",
                    collapsed ? "w-20" : "w-64",
                )}
            >
                <SidebarNav collapsed={collapsed} />
            </aside>

            {/* Mobile drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-72 p-0">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                        Navigation principale de REGLO
                    </SheetDescription>
                    <SidebarNav onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
            </Sheet>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-surface-subtle px-4 sm:px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Ouvrir le menu"
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen(true)}
                    >
                        <PanelLeft />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden lg:inline-flex"
                        aria-label={
                            collapsed ? "Déplier le menu" : "Replier le menu"
                        }
                        aria-controls="app-sidebar"
                        aria-expanded={!collapsed}
                        onClick={toggleCollapsed}
                    >
                        <PanelLeft />
                    </Button>

                    <AppBreadcrumb />

                    <div className="ml-auto flex items-center gap-1 sm:gap-2">
                        {/* Search is a placeholder until the search feature exists. */}
                        <form
                            role="search"
                            className="relative hidden md:block"
                            onSubmit={(event) => event.preventDefault()}
                        >
                            <Search
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-muted"
                            />
                            <Input
                                type="search"
                                aria-label="Rechercher"
                                placeholder="Rechercher…"
                                className="w-64 rounded-full border-border bg-white pl-10"
                            />
                        </form>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Notifications"
                        >
                            <Bell />
                        </Button>
                        <UserMenu {...user} />
                    </div>
                </header>

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
