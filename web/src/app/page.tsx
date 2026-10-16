import Image from "next/image";

export default function Home() {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
            <Image
                src="/brand/reglo-symbol.png"
                alt=""
                width={96}
                height={74}
                priority
            />
            <h1 className="font-display text-5xl font-extrabold text-brand-teal">
                REGLO
            </h1>
            <p className="text-ink-muted">
                Humain en mouvement vers l&apos;avenir
            </p>
        </main>
    );
}
