"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { UserButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";

export function Navbar({ initialUserId }: { initialUserId?: string | null }) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const { isLoaded, userId } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use client-side userId if loaded, otherwise fall back to server-provided initialUserId
  // This completely eliminates layout shift during hydration/language-switch
  const currentUserId = isLoaded ? userId : initialUserId;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isAboutActive = pathname === "/about";
  const isContactActive = pathname === "/contact";

  return (
    <div className={cn(
      "fixed inset-x-0 z-50 flex justify-center w-full transition-all duration-500 pointer-events-none",
      isScrolled ? "top-6 px-4" : "top-0 px-0"
    )}>
      <header className={cn(
        "pointer-events-auto flex items-center justify-center transition-all duration-500",
        isScrolled 
          ? "h-14 w-full max-w-4xl rounded-full border border-white/10 bg-background/40 px-6 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] hover:bg-background/50" 
          : "h-20 w-full max-w-none rounded-none border-b border-transparent bg-transparent px-6 backdrop-blur-sm"
      )}>
        <div className={cn(
          "grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 transition-all duration-500",
          !isScrolled && "max-w-6xl mx-auto"
        )}>
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <BrandLogo
                priority
                className="w-[112px] sm:w-[124px] transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center justify-center space-x-6 text-sm font-medium">
            <Link
              href="/about"
              className={cn(
                "relative py-1 transition-colors group",
                isAboutActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("about")}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-0.5 h-[2px] bg-primary origin-left transition-transform duration-300 rounded-full",
                  isAboutActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                )}
              />
            </Link>
            <Link
              href="/contact"
              className={cn(
                "relative py-1 transition-colors group",
                isContactActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("contact")}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-0.5 h-[2px] bg-primary origin-left transition-transform duration-300 rounded-full",
                  isContactActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                )}
              />
            </Link>
          </nav>
          
          <div className="flex items-center justify-end space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1 border-r border-border/50 pr-3">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            <div className="sm:hidden">
              {!currentUserId ? (
                <Link
                  href="/sign-in"
                  className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("login")}
                </Link>
              ) : (
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-7 h-7 border border-border/60"
                    }
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="Dashboard"
                      labelIcon={<LayoutDashboard className="w-4 h-4 text-primary" />}
                      href="/dashboard"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              )}
            </div>
            
            <div className="hidden sm:flex items-center space-x-2 justify-end">
              {!currentUserId ? (
                <>
                  <Link 
                    href="/sign-in"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
                  >
                    {t("login")}
                  </Link>
                  <Link 
                    href="/sign-up"
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }), 
                      "font-medium rounded-full px-5 shadow-[0_0_15px_-3px_var(--tw-shadow-color)] shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
                    )}
                  >
                    {t("signup")}
                  </Link>
                </>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md scale-110"></div>
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 relative z-10 border-2 border-background shadow-sm hover:scale-105 transition-transform",
                        userButtonPopoverCard: "bg-background/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl",
                        userButtonPopoverActionButton: "hover:bg-muted/50 text-foreground transition-colors",
                        userButtonPopoverActionButtonText: "text-foreground font-medium",
                        userButtonPopoverFooter: "hidden"
                      }
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Dashboard"
                        labelIcon={<LayoutDashboard className="w-4 h-4 text-primary" />}
                        href="/dashboard"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="pointer-events-auto absolute top-full mt-3 w-[min(92vw,420px)] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-2xl shadow-2xl p-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/about"
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isAboutActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {t("about")}
            </Link>
            <Link
              href="/contact"
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isContactActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {t("contact")}
            </Link>
            {!currentUserId ? (
              <Link
                href="/sign-up"
                className="mt-2 rounded-xl bg-foreground px-3 py-2.5 text-center text-sm font-semibold text-background"
              >
                {t("signup")}
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="mt-2 rounded-xl bg-foreground px-3 py-2.5 text-center text-sm font-semibold text-background"
              >
                {t("dashboard")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
