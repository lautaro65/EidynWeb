import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="relative w-full border-t border-border/40 bg-background overflow-hidden mt-auto pt-14 md:pt-24">
      {/* Decorative top gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-6xl pb-16 md:pb-32">
        {/* Pre-footer CTA */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-20 space-y-5 md:space-y-6">
          <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            {t("ctaTitle")}
          </h3>
          <p className="text-muted-foreground max-w-lg text-sm sm:text-base">
            {t("ctaDescription")}
          </p>
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-primary/40 hover:shadow-primary/60 transition-all duration-300">
              {t("ctaButton")}
            </Button>
          </Link>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 border-t border-foreground/5 pt-12 md:pt-16">
          <div className="md:col-span-4 flex flex-col space-y-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <BrandLogo className="w-[124px] transition-transform duration-300 group-hover:scale-[1.02]" />
            </Link>
            <p className="text-muted-foreground/80 font-light max-w-xs leading-relaxed">
              {t("description")}
            </p>
          </div>
          
          <div className="md:col-span-2 md:col-start-9 flex flex-col space-y-5">
            <h4 className="font-medium text-foreground tracking-wider uppercase text-xs">
              {t("legalTitle")}
            </h4>
            <nav className="flex flex-col space-y-4" aria-label={t("legalTitle")}>
              <Link href="/privacy" className="text-muted-foreground/80 hover:text-foreground font-light transition-colors">
                {t("privacy")}
              </Link>
              <Link href="/terms" className="text-muted-foreground/80 hover:text-foreground font-light transition-colors">
                {t("terms")}
              </Link>
            </nav>
          </div>
          
          <div className="md:col-span-2 flex flex-col space-y-5">
            <h4 className="font-medium text-foreground tracking-wider uppercase text-xs">
              {t("socialTitle")}
            </h4>
            <nav className="flex flex-col space-y-4" aria-label={t("socialTitle")}>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="text-muted-foreground/80 hover:text-foreground font-light transition-colors">
                {t("twitter")}
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="text-muted-foreground/80 hover:text-foreground font-light transition-colors">
                {t("linkedin")}
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-muted-foreground/80 hover:text-foreground font-light transition-colors">
                {t("instagram")}
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Giant Watermark Logo */}
      <div className="absolute bottom-[-1rem] sm:bottom-[-4rem] md:bottom-[-6rem] inset-x-0 w-full flex justify-center overflow-hidden pointer-events-none select-none">
        <span className="text-[22vw] sm:text-[18vw] font-black tracking-tighter leading-none text-foreground/5 dark:text-white/[0.02]">
          EIDYN
        </span>
      </div>

      <div className="relative z-10 w-full border-t border-foreground/5 py-5 sm:py-6 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl flex justify-center">
          <p className="text-[11px] sm:text-xs text-muted-foreground/60 font-light tracking-wide text-center">
            &copy; {new Date().getFullYear()} Eidyn. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
