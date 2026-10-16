import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DOMAIN_KEYS, DOMAINS, isDomainKey } from "@/lib/domains";

type Params = PageProps<"/domains/[domain]">["params"];

export function generateStaticParams() {
    return DOMAIN_KEYS.map((domain) => ({ domain }));
}

export async function generateMetadata({
    params,
}: PageProps<"/domains/[domain]">): Promise<Metadata> {
    const { domain } = await params;
    return isDomainKey(domain) ? { title: DOMAINS[domain].label } : {};
}

async function DomainContent({ params }: { params: Params }) {
    const { domain } = await params;
    if (!isDomainKey(domain)) {
        notFound();
    }

    // The domain blocks come in later cards (US-06, US-07…).
    return (
        <PageHeader
            title={DOMAINS[domain].label}
            description="Votre situation et vos actions sur ce domaine."
        />
    );
}

/** One page per QHSE domain. */
export default function DomainPage({ params }: PageProps<"/domains/[domain]">) {
    // Reading the URL params inside Suspense keeps navigation instant.
    return (
        <Suspense fallback={<Skeleton className="mb-8 h-14 w-72" />}>
            <DomainContent params={params} />
        </Suspense>
    );
}
