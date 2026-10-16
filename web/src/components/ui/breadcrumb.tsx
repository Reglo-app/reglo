import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Charter: `[icon] Section / [icon] Page / Detail`, each item a link with its
// page icon, last item not clickable, text ink-muted, separator `/`.

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
    return (
        <nav
            aria-label="Fil d'Ariane"
            data-slot="breadcrumb"
            className={cn(className)}
            {...props}
        />
    );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
    return (
        <ol
            data-slot="breadcrumb-list"
            className={cn(
                "flex flex-wrap items-center gap-1 text-sm text-ink-muted",
                className,
            )}
            {...props}
        />
    );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="breadcrumb-item"
            className={cn("inline-flex items-center", className)}
            {...props}
        />
    );
}

function BreadcrumbLink({
    asChild,
    className,
    ...props
}: React.ComponentProps<"a"> & {
    asChild?: boolean;
}) {
    const Comp = asChild ? Slot.Root : "a";

    return (
        <Comp
            data-slot="breadcrumb-link"
            className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-sm px-1 transition-colors hover:text-ink [&_svg]:size-4 [&_svg]:shrink-0",
                className,
            )}
            {...props}
        />
    );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="breadcrumb-page"
            aria-current="page"
            className={cn(
                "inline-flex min-h-11 items-center gap-1.5 px-1 font-medium text-ink [&_svg]:size-4 [&_svg]:shrink-0",
                className,
            )}
            {...props}
        />
    );
}

function BreadcrumbSeparator({
    children,
    className,
    ...props
}: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="breadcrumb-separator"
            role="presentation"
            aria-hidden="true"
            className={cn("px-0.5 text-border-strong", className)}
            {...props}
        >
            {children ?? "/"}
        </li>
    );
}

export {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
};
