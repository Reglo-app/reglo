import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-base font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    {
        variants: {
            variant: {
                // Primary action: one per page header.
                default: "bg-brand-teal text-white hover:bg-teal-900",
                // Highlight action (charter: yellow fill with teal text).
                highlight:
                    "bg-brand-yellow text-brand-teal hover:bg-brand-yellow/85",
                secondary: "bg-teal-50 text-ink hover:bg-green-50",
                // Bordered at rest, very light green on hover.
                outline:
                    "border-border bg-white text-ink hover:border-border-strong hover:bg-green-50",
                ghost: "text-ink hover:bg-green-50",
                destructive: "bg-danger text-white hover:bg-danger-700",
                link: "h-auto px-0 text-green-700 underline-offset-4 hover:underline",
                // Topbar controls (menu toggle, notifications): compact,
                // teal border at rest, green border and light green on hover.
                toolbar:
                    "rounded-(--radius-control) border-brand-teal/32 bg-white text-[13px] font-semibold text-ink hover:border-brand-green hover:bg-green-50",
            },
            size: {
                // Charter: interactive controls are at least 40px high.
                default: "h-10 px-4",
                lg: "h-11 px-5 text-lg",
                icon: "size-10",
                // Topbar: 7px vertical / 12px horizontal padding.
                toolbar: "px-3 py-[7px] [&_svg:not([class*='size-'])]:size-4",
                "toolbar-icon":
                    "p-[7px] [&_svg:not([class*='size-'])]:size-[18px]",
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
