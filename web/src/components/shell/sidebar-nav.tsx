"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    HOME_ITEM,
    NAV_GROUPS,
    SETTINGS_ITEM,
    isActive,
    type NavItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
    /** Icons only (desktop collapsed sidebar). */
    collapsed?: boolean;
    /** Called after a link is clicked (closes the mobile drawer). */
    onNavigate?: () => void;
};

function NavLink({
    item,
    collapsed,
    onNavigate,
}: {
    item: NavItem;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const active = isActive(item, pathname);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-base font-medium transition-colors",
                active
                    ? "bg-green-50 text-ink"
                    : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
                collapsed && "justify-center px-0",
            )}
        >
            <Icon
                aria-hidden="true"
                className={cn(
                    "size-5 shrink-0",
                    active ? "text-green-700" : "text-ink-muted",
                )}
            />
            <span className={cn(collapsed && "sr-only")}>{item.label}</span>
        </Link>
    );
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
    return (
        <div className="flex h-full flex-col gap-6 px-3 py-4">
            <Link
                href={HOME_ITEM.href}
                onClick={onNavigate}
                className={cn(
                    "flex min-h-11 items-center gap-2 rounded-md px-2",
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
                className="flex flex-1 flex-col gap-6"
            >
                {NAV_GROUPS.map((group) => (
                    <div key={group.label} className="flex flex-col gap-1">
                        <p
                            className={cn(
                                "px-3 pb-1 text-xs font-medium tracking-wide text-ink-muted uppercase",
                                collapsed && "sr-only",
                            )}
                        >
                            {group.label}
                        </p>
                        <ul className="flex flex-col gap-1">
                            {group.items.map((item) => (
                                <li key={item.href}>
                                    <NavLink
                                        item={item}
                                        collapsed={collapsed}
                                        onNavigate={onNavigate}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <ul className="mt-auto flex flex-col gap-1">
                    <li>
                        <NavLink
                            item={SETTINGS_ITEM}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                        />
                    </li>
                </ul>
            </nav>
        </div>
    );
}
