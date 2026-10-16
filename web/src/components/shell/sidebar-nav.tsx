"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DOMAIN_ICON_CLASSES } from "@/lib/domains";
import {
    HOME_ITEM,
    NAV_SECTIONS,
    SETTINGS_ITEM,
    findNavEntry,
    type NavItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
    /** Icons only (desktop collapsed sidebar). */
    collapsed?: boolean;
    /** Called after a link is clicked (closes the mobile drawer). */
    onNavigate?: () => void;
};

/**
 * One top-level entry and, inside its branch, its sub-pages. Sub-pages have
 * no icon and their text lines up with the parent's text.
 */
function NavBranch({
    item,
    collapsed,
    onNavigate,
}: {
    item: NavItem;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const entry = findNavEntry(usePathname());
    const inBranch = entry?.item.href === item.href;
    const current = inBranch && !entry.isChild;
    // Parent of the current sub-page: emphasised, without the active fill.
    // In the folded sidebar there are no sub-pages, so it keeps the fill.
    const parentOfCurrent = inBranch && entry.isChild;
    const filled = current || (parentOfCurrent && collapsed);
    const Icon = item.icon;

    return (
        <li>
            <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={current ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                    "flex min-h-10 items-center gap-3 rounded-md px-3 text-base font-medium transition-colors",
                    filled
                        ? "bg-green-50 text-ink"
                        : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
                    parentOfCurrent && "font-semibold text-ink",
                    collapsed && "justify-center px-0",
                )}
            >
                <Icon
                    aria-hidden="true"
                    className={cn(
                        "size-5 shrink-0",
                        // QHSE pillars keep their colour; other icons follow the state.
                        item.domain
                            ? DOMAIN_ICON_CLASSES[item.domain]
                            : inBranch
                              ? "text-green-700"
                              : "text-ink-muted",
                    )}
                />
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
            </Link>

            {item.children && inBranch && !collapsed && (
                <ul className="mt-1 flex flex-col gap-1">
                    {item.children.map((child) => {
                        const childCurrent = entry.href === child.href;
                        return (
                            <li key={child.href}>
                                <Link
                                    href={child.href}
                                    onClick={onNavigate}
                                    aria-current={
                                        childCurrent ? "page" : undefined
                                    }
                                    // pl-11 = item padding (12px) + icon (20px) + gap (12px).
                                    className={cn(
                                        "flex min-h-9 items-center rounded-md pr-3 pl-11 text-sm font-medium transition-colors",
                                        childCurrent
                                            ? "bg-green-50 text-ink"
                                            : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
                                    )}
                                >
                                    {child.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>
    );
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
    return (
        <div className="flex h-full flex-col gap-4 py-4">
            <Link
                href={HOME_ITEM.href}
                onClick={onNavigate}
                className={cn(
                    "mx-3 flex min-h-10 items-center gap-2 rounded-md px-2",
                    collapsed && "justify-center px-0",
                )}
            >
                <Image
                    src="/brand/reglo-symbol.png"
                    alt=""
                    width={36}
                    height={28}
                    priority
                />
                {/* Text wordmark until the full logo is delivered. */}
                <span
                    className={cn(
                        "font-display text-2xl font-extrabold text-brand-teal",
                        collapsed && "sr-only",
                    )}
                >
                    REGLO
                </span>
            </Link>

            <nav
                aria-label="Navigation principale"
                className="flex min-h-0 flex-1 flex-col"
            >
                {/* Only the sections scroll; Paramètres stays at the bottom. */}
                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3">
                    {NAV_SECTIONS.map((section, index) => (
                        <div key={section.title ?? index}>
                            {section.title && (
                                <p
                                    className={cn(
                                        "px-3 pb-1.5 text-xs font-medium tracking-wide text-ink-muted uppercase",
                                        collapsed && "sr-only",
                                    )}
                                >
                                    {section.title}
                                </p>
                            )}
                            <ul className="flex flex-col gap-1">
                                {section.items.map((item) => (
                                    <NavBranch
                                        key={item.href}
                                        item={item}
                                        collapsed={collapsed}
                                        onNavigate={onNavigate}
                                    />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <ul className="mx-3 mt-2 flex flex-col gap-1 border-t border-border pt-2">
                    <NavBranch
                        item={SETTINGS_ITEM}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                    />
                </ul>
            </nav>
        </div>
    );
}
