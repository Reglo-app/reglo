import { Badge } from "@/components/ui/badge";
import { DOMAINS, type DomainKey } from "@/lib/domains";
import { cn } from "@/lib/utils";

const DOT_CLASSES: Record<DomainKey, string> = {
    quality: "bg-quality",
    hygiene: "bg-hygiene",
    safety: "bg-safety",
    environment: "bg-environment",
};

/** QHSE domain chip: tinted background, coloured dot and the domain name. */
export function DomainBadge({
    domain,
    className,
}: {
    domain: DomainKey;
    className?: string;
}) {
    return (
        <Badge variant={domain} className={className}>
            <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", DOT_CLASSES[domain])}
            />
            {DOMAINS[domain].label}
        </Badge>
    );
}
