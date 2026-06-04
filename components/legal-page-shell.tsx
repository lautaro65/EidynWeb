import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  backLabel: string;
  sections: LegalSection[];
  contactTitle: string;
  contactText: string;
  contactCta: string;
};

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  lastUpdatedLabel,
  lastUpdated,
  backLabel,
  sections,
  contactTitle,
  contactText,
  contactCta,
}: LegalPageShellProps) {
  return (
    <div className="relative overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(201,123,90,0.16),transparent_58%)] pointer-events-none" />
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-32 md:pt-36">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <section className="relative pb-10">
          <div className="mb-6 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
                {title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {intro}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-border/50 bg-muted/35 p-5 text-sm text-muted-foreground">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
                {lastUpdatedLabel}
              </div>
              <div className="mt-2 text-sm font-medium text-foreground">{lastUpdated}</div>
            </div>
          </div>
          <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </section>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[2rem] border border-border/50 bg-background/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl"
            >
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{section.title}</h2>

              {section.paragraphs?.length ? (
                <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {section.bullets?.length ? (
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground md:text-base">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 rounded-2xl border border-border/40 bg-muted/30 px-4 py-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-[2rem] border border-border/50 bg-gradient-to-br from-muted/50 to-background p-8 shadow-[0_16px_50px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{contactTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {contactText}
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
            >
              {contactCta}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
