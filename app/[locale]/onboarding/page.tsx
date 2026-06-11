"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Store, User, ArrowRight, Loader2, Check, Shirt } from "lucide-react";
import { submitOnboarding } from "./actions";

export default function OnboardingPage() {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"shopper" | "store_owner" | "brand_owner" | null>(null);
  const [storeName, setStoreName] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNextStep = async () => {
    if (role === "shopper") {
      await handleComplete();
    } else {
      setStep(2);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("role", role!);
      
      if (role === "store_owner" || role === "brand_owner") {
        formData.append("storeName", storeName);
        formData.append("plan", plan);
      }
      
      if (role === "brand_owner") {
        if (websiteUrl) formData.append("websiteUrl", websiteUrl);
        if (socialUrl) formData.append("socialUrl", socialUrl);
        if (logoFile) formData.append("logoFile", logoFile);
      }

      await submitOnboarding(formData);
      if (role === "store_owner") {
        router.push("/dashboard/shop/analytics");
      } else if (role === "brand_owner") {
        router.push("/dashboard/brand");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado al crear la cuenta.";
      setErrorMsg(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 pt-24 md:pt-32">
      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: step === 1 ? "20px" : "6px",
              background: step === 1 ? "var(--primary)" : "var(--border)",
            }}
          />
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: step === 2 ? "20px" : "6px",
              background: step === 2 ? "var(--primary)" : "var(--border)",
            }}
          />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">{t("welcome")}</div>

            <h1 className="font-serif text-5xl font-light tracking-tight leading-tight text-foreground mb-2">
              {t("step1Title")}
            </h1>
            <p className="text-muted-foreground text-base font-light mb-10">
              {t("step1Subtitle")}
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {/* Shopper card */}
              <button
                onClick={() => setRole("shopper")}
                aria-label={t("shopperTitle")}
                className={`
                  relative flex flex-col items-start gap-3 p-7 border-2 rounded-[1.4rem] text-left
                  transition-all duration-200 group
                  ${
                    role === "shopper"
                      ? "border-primary bg-primary/[0.04]"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-[0_4px_24px_-8px_rgba(201,123,90,0.15)]"
                  }
                `}
              >
                {role === "shopper" && (
                  <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check
                      className="w-3 h-3 text-primary-foreground"
                      strokeWidth={3}
                    />
                  </span>
                )}
                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200
                    ${role === "shopper" ? "bg-primary/12" : "bg-muted group-hover:bg-primary/8"}
                  `}
                >
                  <User
                    className={`w-5 h-5 transition-colors duration-200 ${role === "shopper" ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="font-medium text-[0.95rem] text-foreground mb-1">
                    {t("shopperTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {t("shopperDesc")}
                  </p>
                </div>
              </button>

              {/* Store owner card */}
              <button
                onClick={() => setRole("store_owner")}
                aria-label={t("storeTitle")}
                className={`
                  relative flex flex-col items-start gap-3 p-7 border-2 rounded-[1.4rem] text-left
                  transition-all duration-200 group
                  ${
                    role === "store_owner"
                      ? "border-primary bg-primary/[0.04]"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-[0_4px_24px_-8px_rgba(201,123,90,0.15)]"
                  }
                `}
              >
                {role === "store_owner" && (
                  <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check
                      className="w-3 h-3 text-primary-foreground"
                      strokeWidth={3}
                    />
                  </span>
                )}
                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200
                    ${role === "store_owner" ? "bg-primary/12" : "bg-muted group-hover:bg-primary/8"}
                  `}
                >
                  <Store
                    className={`w-5 h-5 transition-colors duration-200 ${role === "store_owner" ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="font-medium text-[0.95rem] text-foreground mb-1">
                    {t("storeTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {t("storeDesc")}
                  </p>
                </div>
              </button>

              {/* Brand owner card */}
              <button
                onClick={() => setRole("brand_owner")}
                aria-label={t("brandTitle") || "Brand Owner"}
                className={`
                  relative flex flex-col items-start gap-3 p-7 border-2 rounded-[1.4rem] text-left
                  transition-all duration-200 group
                  ${
                    role === "brand_owner"
                      ? "border-primary bg-primary/[0.04]"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-[0_4px_24px_-8px_rgba(201,123,90,0.15)]"
                  }
                `}
              >
                {role === "brand_owner" && (
                  <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check
                      className="w-3 h-3 text-primary-foreground"
                      strokeWidth={3}
                    />
                  </span>
                )}
                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200
                    ${role === "brand_owner" ? "bg-primary/12" : "bg-muted group-hover:bg-primary/8"}
                  `}
                >
                  <Shirt
                    className={`w-5 h-5 transition-colors duration-200 ${role === "brand_owner" ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="font-medium text-[0.95rem] text-foreground mb-1">
                    {t("brandTitle") || "Dueño de Marca"}
                  </p>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {t("brandDesc") || "Crea prendas 3D y distribúyelas a las tiendas."}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={!role || isSubmitting}
                className="
                  inline-flex items-center gap-2 px-7 py-3 rounded-[0.875rem]
                  bg-foreground text-background text-sm font-medium
                  transition-all duration-200
                  hover:bg-primary hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(201,123,90,0.4)]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none
                "
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : role === "shopper" ? (
                  t("completeSetupBtn")
                ) : (
                  <>
                    {t("continueBtn")}
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium tracking-widest uppercase px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">{t("yourStore")}</div>

            <h1 className="font-serif text-5xl font-light tracking-tight leading-tight text-foreground mb-2">
              {t("step2Title")}
            </h1>
            <p className="text-muted-foreground text-base font-light mb-10">
              {t("step2Subtitle")}
            </p>

            <div className="bg-card border border-border/60 rounded-[2rem] p-8 shadow-sm space-y-8">
              {/* Store name */}
              <div className="space-y-2">
                <label htmlFor="storeNameInput" className="block text-[0.7rem] font-medium tracking-widest uppercase text-muted-foreground">
                  {t("storeNameLabel")}
                </label>
                <input
                  id="storeNameInput"
                  type="text"
                  placeholder={t("storeNamePlaceholder")}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="
                    w-full h-12 px-4 rounded-[0.875rem]
                    border-[1.5px] border-border bg-background
                    text-[0.95rem] text-foreground placeholder:text-muted-foreground/50
                    font-light outline-none
                    transition-colors duration-200
                    focus:border-primary
                  "
                />
              </div>

              {/* Brand Extra Fields */}
              {role === "brand_owner" && (
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-medium tracking-widest uppercase text-muted-foreground">
                      {t("websiteLabel") || "Página Web"}
                    </label>
                    <input
                      type="url"
                      placeholder={t("websitePlaceholder") || "https://tumarca.com"}
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full h-12 px-4 rounded-[0.875rem] border-[1.5px] border-border bg-background text-[0.95rem] text-foreground placeholder:text-muted-foreground/50 font-light outline-none transition-colors duration-200 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-medium tracking-widest uppercase text-muted-foreground">
                      {t("socialLabel") || "Red Social Principal"}
                    </label>
                    <input
                      type="url"
                      placeholder={t("socialPlaceholder") || "https://instagram.com/tumarca"}
                      value={socialUrl}
                      onChange={(e) => setSocialUrl(e.target.value)}
                      className="w-full h-12 px-4 rounded-[0.875rem] border-[1.5px] border-border bg-background text-[0.95rem] text-foreground placeholder:text-muted-foreground/50 font-light outline-none transition-colors duration-200 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-medium tracking-widest uppercase text-muted-foreground">
                      {t("logoLabel") || "Logo de la Marca"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-[0.875rem] file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {role !== "brand_owner" && (
                <>
                  {/* Divider */}
                  <div className="h-px bg-border opacity-60" />

              {/* Plan selector */}
              <div className="space-y-3">
                <label className="block text-[0.7rem] font-medium tracking-widest uppercase text-muted-foreground">
                  {t("selectPlanLabel")}
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {/* Free */}
                  <button
                    onClick={() => setPlan("free")}
                    aria-label={t("freePlanTitle")}
                    className={`
                      relative flex flex-col items-start gap-3 p-5 border-[1.5px] rounded-[1.125rem] text-left
                      transition-all duration-200
                      ${
                        plan === "free"
                          ? "border-primary bg-primary/[0.04]"
                          : "border-border hover:border-primary/40"
                      }
                    `}
                  >
                    {plan === "free" && (
                      <span className="absolute top-3.5 right-3.5 w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center">
                        <Check
                          className="w-2.5 h-2.5 text-primary-foreground"
                          strokeWidth={3}
                        />
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {t("freePlanTitle")}
                      </p>
                      <p className="font-serif text-2xl font-light text-primary leading-tight">
                        $0{" "}
                        <span className="font-sans text-xs text-muted-foreground">
                          / mes
                        </span>
                      </p>
                    </div>
                    <ul className="text-xs text-muted-foreground font-light space-y-1">
                      <li className="before:content-['—\u2002'] before:text-border/80">
                        {t("freePlanFeature1")}
                      </li>
                      <li className="before:content-['—\u2002'] before:text-border/80">
                        {t("freePlanFeature2")}
                      </li>
                      <li className="before:content-['—\u2002'] before:text-border/80">
                        {t("freePlanFeature3")}
                      </li>
                    </ul>
                  </button>

                  {/* Pro */}
                  <button
                    onClick={() => setPlan("pro")}
                    aria-label={t("proPlanTitle")}
                    className={`
                      relative flex flex-col items-start gap-3 p-5 border-[1.5px] rounded-[1.125rem] text-left
                      transition-all duration-200
                      ${
                        plan === "pro"
                          ? "border-primary bg-primary/[0.04]"
                          : "border-border hover:border-primary/40"
                      }
                    `}
                  >
                    {plan === "pro" && (
                      <span className="absolute top-3.5 right-3.5 w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center">
                        <Check
                          className="w-2.5 h-2.5 text-primary-foreground"
                          strokeWidth={3}
                        />
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {t("proPlanTitle")}
                      </p>
                      <p className="font-serif text-2xl font-light text-primary leading-tight">
                        $49{" "}
                        <span className="font-sans text-xs text-muted-foreground">
                          / mes
                        </span>
                      </p>
                    </div>
                    <ul className="text-xs text-muted-foreground font-light space-y-1">
                      <li className="before:content-['—\u2002'] before:text-border/80">
                        {t("proPlanFeature1")}
                      </li>
                      <li className="before:content-['—\u2002'] before:text-border/80">
                        {t("proPlanFeature2")}
                      </li>
                      <li className="before:content-['—\u2002'] before:text-border/80">
                        {t("proPlanFeature3")}
                      </li>
                    </ul>
                  </button>
                </div>
              </div>
              </>
            )}
            </div>

              <div className="flex flex-col gap-4 mt-8">
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                    {errorMsg}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg disabled:opacity-40"
              >
                {t("backBtn")}
              </button>

              <button
                onClick={handleComplete}
                disabled={
                  isSubmitting || 
                  !storeName.trim() || 
                  (role === "brand_owner" && (!websiteUrl.trim() || !socialUrl.trim() || !logoFile))
                }
                className="
                  inline-flex items-center gap-2 px-7 py-3 rounded-[0.875rem]
                  bg-foreground text-background text-sm font-medium
                  transition-all duration-200
                  hover:bg-primary hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(201,123,90,0.4)]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none
                "
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t("launchStoreBtn")}
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </>
                )}
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
