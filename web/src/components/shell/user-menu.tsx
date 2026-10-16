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
            {/* Round avatar and chevron only; name, role and organization
                are in the menu. */}
            <DropdownMenuTrigger
                aria-label={`Menu de ${fullName}, ${organizationName}`}
                className="ml-1 flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-[background-color,box-shadow] hover:bg-green-50 hover:shadow-sm aria-expanded:bg-green-50 aria-expanded:shadow-sm sm:ml-2"
            >
                <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-teal text-xs font-semibold text-white"
                >
                    {initials(fullName)}
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
