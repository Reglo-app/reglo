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

/**
 * Icon colours of each domain: the outline stays dark enough to be seen on
 * white, the fill carries the domain colour (charter: blue and yellow are
 * fills, never strokes or text on white).
 */
export const DOMAIN_ICON_CLASSES: Record<DomainKey, string> = {
    quality: "text-brand-teal fill-quality/20",
    hygiene: "text-blue-700 fill-hygiene",
    safety: "text-brand-teal fill-safety",
    environment: "text-green-700 fill-environment/45",
};

export function isDomainKey(value: unknown): value is DomainKey {
    return (
        typeof value === "string" &&
        (DOMAIN_KEYS as readonly string[]).includes(value)
    );
}
