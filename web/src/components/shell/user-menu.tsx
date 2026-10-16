"use client";

import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserMenuProps = {
    fullName: string;
    roleLabel: string;
    organizationName: string;
};

function initials(fullName: string): string {
    return fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export function UserMenu({
    fullName,
    roleLabel,
    organizationName,
}: UserMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Menu de ${fullName}`}
                className="flex items-center gap-2 rounded-(--radius-control) border border-brand-teal/32 bg-white py-[5px] pr-2.5 pl-[5px] text-[13px] font-semibold text-ink transition-colors hover:border-brand-green hover:bg-green-50 aria-expanded:border-brand-green aria-expanded:bg-green-50"
            >
                <span
                    aria-hidden="true"
                    className="flex size-[22px] items-center justify-center rounded-sm bg-brand-blue text-[11px] font-semibold text-brand-teal"
                >
                    {initials(fullName)}
                </span>
                {/* One line, like the other topbar controls; the role is in the menu. */}
                <span className="hidden leading-5 md:block">{fullName}</span>
                <ChevronDown
                    aria-hidden="true"
                    className="size-4 text-ink-muted"
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                    <span className="block text-sm font-medium text-ink">
                        {fullName}
                    </span>
                    <span className="block text-xs text-ink-muted">
                        {roleLabel} · {organizationName}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/settings">
                        <UserRound aria-hidden="true" />
                        Mon profil
                    </Link>
                </DropdownMenuItem>
                {/* Logout is wired with authentication (US-02). */}
                <DropdownMenuItem disabled>
                    <LogOut aria-hidden="true" />
                    Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
