import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, Shirt, Plug, ShieldCheck, ChevronRight, ShoppingCart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="fixed left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-50 blur-[100px]"></div>

      {/* Hero Section */}
      <section className="relative w-full pt-40 pb-24 md:pt-52 md:pb-32 flex flex-col items-center justify-center overflow-hidden">
        <div className="container px-4 sm:px-6 mx-auto flex flex-col items-center text-center max-w-5xl z-10">
          
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary mb-10 backdrop-blur-md shadow-sm hover:bg-primary/10 transition-colors cursor-default">
            <Sparkles className="mr-2 h-4 w-4" />
            <span>V1.0 - The Next Gen Try-On API</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 mb-8 leading-[1.05]">
            {t("heroTitle")}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground/80 mb-12 max-w-2xl font-light leading-relaxed">
            {t("heroSubtitle")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
            <Link 
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "group text-lg px-8 py-7 rounded-full transition-all duration-300 shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-primary/40 hover:shadow-primary/60 font-medium"
              )}
            >
              {t("ctaStart")}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "text-lg px-8 py-7 rounded-full border-white/10 bg-background/50 backdrop-blur-md hover:bg-muted/50 font-medium transition-colors"
              )}
            >
              {t("ctaDemo")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative w-full py-32 border-y border-white/5 bg-background/50 backdrop-blur-3xl">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70">
              {t("featuresTitle")}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group flex flex-col p-8 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-primary/20 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-300">
                <Shirt className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("feature1Title")}</h3>
              <p className="text-muted-foreground/80 font-light leading-relaxed">
                {t("feature1Desc")}
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="group flex flex-col p-8 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-primary/20 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-300">
                <Plug className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("feature2Title")}</h3>
              <p className="text-muted-foreground/80 font-light leading-relaxed">
                {t("feature2Desc")}
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="group flex flex-col p-8 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-primary/20 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t("feature3Title")}</h3>
              <p className="text-muted-foreground/80 font-light leading-relaxed">
                {t("feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full py-40 relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full -z-10"></div>
        
        <div className="container px-4 sm:px-6 mx-auto relative z-10 text-center flex flex-col items-center max-w-3xl">
          <div className="h-24 w-24 rounded-full bg-background/50 backdrop-blur-xl flex items-center justify-center shadow-2xl mb-10 border border-white/10">
            <ShoppingCart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70">
            {t("finalCtaTitle")}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground/80 mb-12 font-light">
            {t("finalCtaSubtitle")}
          </p>
          <Link 
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "group text-lg px-10 py-7 rounded-full shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 font-medium"
            )}
          >
            {t("ctaStart")}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
