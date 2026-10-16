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
            {/* Different from the bordered topbar controls: no frame, a
                larger avatar and two lines (person, then organization). */}
            <DropdownMenuTrigger
                aria-label={`Menu de ${fullName}, ${organizationName}`}
                className="ml-1 flex items-center gap-2.5 rounded-md py-1 pr-2 pl-1 text-left transition-colors hover:bg-green-50 aria-expanded:bg-green-50 sm:ml-2 sm:border-l sm:border-border sm:pl-3"
            >
                <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-teal text-sm font-semibold text-white"
                >
                    {initials(fullName)}
                </span>
                <span className="hidden leading-tight md:block">
                    <span className="block text-sm font-semibold text-ink">
                        {fullName}
                    </span>
                    <span className="block max-w-40 truncate text-xs text-ink-muted">
                        {organizationName}
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
