"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, User, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { submitOnboarding } from "./actions";

export default function OnboardingPage() {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"shopper" | "store_owner" | null>(null);
  
  const [storeName, setStoreName] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = async () => {
    if (role === "shopper") {
      await handleComplete();
    } else {
      setStep(2);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await submitOnboarding({
        role: role!,
        storeName: role === "store_owner" ? storeName : undefined,
        plan: role === "store_owner" ? plan : undefined,
      });
      
      if (role === "store_owner") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {step === 1 ? t("step1Title") : t("step2Title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {step === 1 ? t("step1Subtitle") : t("step2Subtitle")}
          </p>
        </div>

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <button
              onClick={() => setRole("shopper")}
              className={`relative flex flex-col items-center p-8 border-2 rounded-2xl transition-all duration-200 hover:shadow-lg ${
                role === "shopper" 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {role === "shopper" && (
                <CheckCircle2 className="absolute top-4 right-4 text-primary h-6 w-6" />
              )}
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("shopperTitle")}</h3>
              <p className="text-muted-foreground text-center text-sm">
                {t("shopperDesc")}
              </p>
            </button>

            <button
              onClick={() => setRole("store_owner")}
              className={`relative flex flex-col items-center p-8 border-2 rounded-2xl transition-all duration-200 hover:shadow-lg ${
                role === "store_owner" 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {role === "store_owner" && (
                <CheckCircle2 className="absolute top-4 right-4 text-primary h-6 w-6" />
              )}
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Store className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("storeTitle")}</h3>
              <p className="text-muted-foreground text-center text-sm">
                {t("storeDesc")}
              </p>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <Label htmlFor="storeName" className="text-base">{t("storeNameLabel")}</Label>
              <Input 
                id="storeName" 
                placeholder={t("storeNamePlaceholder")}
                className="h-12 text-lg"
                value={storeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreName(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base">{t("selectPlanLabel")}</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPlan("free")}
                  className={`flex flex-col p-6 border-2 rounded-xl text-left transition-all ${
                    plan === "free" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">{t("freePlanTitle")}</h4>
                    {plan === "free" && <CheckCircle2 className="text-primary h-5 w-5" />}
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 mt-2">
                    <li>• {t("freePlanFeature1")}</li>
                    <li>• {t("freePlanFeature2")}</li>
                    <li>• {t("freePlanFeature3")}</li>
                  </ul>
                </button>

                <button
                  onClick={() => setPlan("pro")}
                  className={`flex flex-col p-6 border-2 rounded-xl text-left transition-all ${
                    plan === "pro" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">{t("proPlanTitle")}</h4>
                    {plan === "pro" && <CheckCircle2 className="text-primary h-5 w-5" />}
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 mt-2">
                    <li>• {t("proPlanFeature1")}</li>
                    <li>• {t("proPlanFeature2")}</li>
                    <li>• {t("proPlanFeature3")}</li>
                  </ul>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-8">
          {step === 2 ? (
            <Button variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
              {t("backBtn")}
            </Button>
          ) : (
            <div></div> 
          )}
          
          <Button 
            size="lg" 
            onClick={step === 1 ? handleNextStep : handleComplete}
            disabled={!role || (step === 2 && !storeName.trim()) || isSubmitting}
            className="px-8 shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : step === 1 && role === "shopper" ? (
              t("completeSetupBtn")
            ) : step === 1 ? (
              <>{t("continueBtn")} <ChevronRight className="ml-2 h-5 w-5" /></>
            ) : (
              t("launchStoreBtn")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
