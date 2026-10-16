import {
    BadgeCheck,
    HardHat,
    HeartPulse,
    Leaf,
    type LucideIcon,
} from "lucide-react";

/** The four QHSE pillars. Technical keys are shared with the API. */
export const DOMAIN_KEYS = [
    "quality",
    "hygiene",
    "safety",
    "environment",
] as const;

export type DomainKey = (typeof DOMAIN_KEYS)[number];

export type Domain = {
    key: DomainKey;
    label: string;
    icon: LucideIcon;
};

export const DOMAINS: Record<DomainKey, Domain> = {
    quality: { key: "quality", label: "Qualité", icon: BadgeCheck },
    hygiene: { key: "hygiene", label: "Hygiène-Santé", icon: HeartPulse },
    safety: { key: "safety", label: "Sécurité", icon: HardHat },
    environment: { key: "environment", label: "Environnement", icon: Leaf },
};

export function isDomainKey(value: unknown): value is DomainKey {
    return (
        typeof value === "string" &&
        (DOMAIN_KEYS as readonly string[]).includes(value)
    );
}
