import {
    ClipboardCheck,
    FileCheck,
    GraduationCap,
    LayoutDashboard,
    ListChecks,
    Newspaper,
    Settings,
    type LucideIcon,
} from "lucide-react";

import { DOMAIN_KEYS, DOMAINS, type DomainKey } from "@/lib/domains";

export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    /** QHSE domain of the page, shown with its colour in the sidebar. */
    domain?: DomainKey;
};

export type NavGroup = {
    label: string;
    items: NavItem[];
};

export const HOME_ITEM: NavItem = {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
};

export const NAV_GROUPS: NavGroup[] = [
    {
        label: "Pilotage",
        items: [
            HOME_ITEM,
            { href: "/diagnostic", label: "Diagnostic", icon: ClipboardCheck },
            { href: "/actions", label: "Plan d'actions", icon: ListChecks },
        ],
    },
    {
        label: "Domaines QHSE",
        items: DOMAIN_KEYS.map((key) => ({
            href: `/dashboard/${key}`,
            label: DOMAINS[key].label,
            icon: DOMAINS[key].icon,
            domain: key,
        })),
    },
    {
        label: "Ressources",
        items: [
            { href: "/documents", label: "Justificatifs", icon: FileCheck },
            { href: "/trainings", label: "Formations", icon: GraduationCap },
            { href: "/news", label: "Veille réglementaire", icon: Newspaper },
        ],
    },
];

export const SETTINGS_ITEM: NavItem = {
    href: "/settings",
    label: "Paramètres",
    icon: Settings,
};

const ALL_ITEMS: NavItem[] = [
    ...NAV_GROUPS.flatMap((group) => group.items),
    SETTINGS_ITEM,
];

/** True when `pathname` is the item's page or one of its sub-pages. */
export function isActive(item: NavItem, pathname: string): boolean {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Nav item of the current page. The most specific match wins, so
 * `/dashboard/safety` is "Sécurité", not "Tableau de bord".
 */
export function findNavItem(pathname: string): NavItem | undefined {
    return ALL_ITEMS.filter((item) => isActive(item, pathname)).sort(
        (a, b) => b.href.length - a.href.length,
    )[0];
}

export type Crumb = {
    label: string;
    href: string;
    icon?: LucideIcon;
    domain?: DomainKey;
};

/**
 * Breadcrumb for a path: home, then the section, then any detail segment.
 * The last crumb is the current page.
 */
export function getBreadcrumb(pathname: string): Crumb[] {
    const crumbs: Crumb[] = [HOME_ITEM];
    const section = findNavItem(pathname);

    if (section && section !== HOME_ITEM) {
        crumbs.push(section);
    }

    if (section && pathname !== section.href) {
        const detail = pathname.slice(section.href.length + 1).split("/")[0];
        crumbs.push({
            label: decodeURIComponent(detail),
            href: `${section.href}/${detail}`,
        });
    }

    return crumbs;
}
