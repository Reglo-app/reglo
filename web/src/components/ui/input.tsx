import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "h-11 w-full min-w-0 rounded-md border border-border-strong bg-white px-3 text-base text-ink transition-colors placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60 aria-invalid:border-danger file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
