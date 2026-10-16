import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent text-base font-medium whitespace-nowrap transition-[color,background-color,box-shadow] select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    {
        variants: {
            variant: {
                // Filled and outlined buttons have a relief (theme.css
                // shadow-raised*) and look pressed when clicked.
                // Primary action: one per page header.
                default:
                    "bg-brand-teal text-white shadow-raised-strong hover:bg-teal-900 active:shadow-pressed",
                // Highlight action (charter: yellow fill with teal text).
                highlight:
                    "bg-brand-yellow text-brand-teal shadow-raised hover:bg-brand-yellow/85 active:shadow-pressed",
                secondary:
                    "bg-teal-50 text-ink shadow-raised hover:bg-green-50 active:shadow-pressed",
                outline:
                    "border-border bg-white text-ink shadow-raised hover:bg-surface-subtle active:shadow-pressed",
                // Flat at rest, raised on hover (topbar icon buttons).
                ghost: "text-ink hover:bg-white hover:shadow-raised active:shadow-pressed",
                destructive:
                    "bg-danger text-white shadow-raised-strong hover:bg-danger-700 active:shadow-pressed",
                link: "h-auto px-0 text-green-700 underline-offset-4 hover:underline",
            },
            size: {
                // Charter: interactive controls are at least 44px high.
                default: "h-11 px-5",
                lg: "h-12 px-6 text-lg",
                icon: "size-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function Button({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot.Root : "button";

    return (
        <Comp
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
