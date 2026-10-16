"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DOMAIN_KEYS,
    DOMAINS,
    isDomainKey,
    type DomainKey,
} from "@/lib/domains";

const ACCENT_CLASSES: Record<DomainKey, string> = {
    quality: "[--tab-accent:var(--color-quality)]",
    hygiene: "[--tab-accent:var(--color-hygiene)]",
    safety: "[--tab-accent:var(--color-safety)]",
    environment: "[--tab-accent:var(--color-environment)]",
};

/**
 * One tab per QHSE domain. The selected domain is kept in the URL
 * (`?domain=safety`) so it can be shared and survives a reload.
 */
export function DomainTabs() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const param = searchParams.get("domain");
    const current: DomainKey = isDomainKey(param) ? param : "quality";

    function select(value: string) {
        const params = new URLSearchParams(searchParams);
        params.set("domain", value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    return (
        <Tabs value={current} onValueChange={select}>
            <TabsList
                variant="line"
                aria-label="Domaines QHSE"
                className="w-full"
            >
                {DOMAIN_KEYS.map((key) => {
                    const { label, icon: Icon } = DOMAINS[key];
                    return (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className={ACCENT_CLASSES[key]}
                        >
                            <Icon aria-hidden="true" />
                            {label}
                        </TabsTrigger>
                    );
                })}
            </TabsList>

            {DOMAIN_KEYS.map((key) => (
                // Domain blocks come in later cards (US-06, US-07…).
                <TabsContent key={key} value={key} className="min-h-64">
                    <h2 className="sr-only">{DOMAINS[key].label}</h2>
                </TabsContent>
            ))}
        </Tabs>
    );
}
