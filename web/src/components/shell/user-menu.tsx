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
                className="flex min-h-10 items-center gap-2.5 rounded-md border border-border bg-white py-0.5 pr-2 pl-1 transition-colors hover:border-border-strong hover:bg-green-50 aria-expanded:bg-green-50"
            >
                <span
                    aria-hidden="true"
                    className="flex size-8 items-center justify-center rounded-sm bg-brand-blue text-sm font-semibold text-brand-teal"
                >
                    {initials(fullName)}
                </span>
                <span className="hidden text-left leading-tight md:block">
                    <span className="block text-sm font-medium text-ink">
                        {fullName}
                    </span>
                    <span className="block text-xs text-ink-muted">
                        {roleLabel}
                    </span>
                </span>
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
                        {organizationName}
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
