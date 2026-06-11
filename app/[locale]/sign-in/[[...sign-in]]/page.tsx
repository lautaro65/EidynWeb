import { SignIn } from "@clerk/nextjs";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === "es" ? "Iniciar Sesión - Eidyn" : "Sign In - Eidyn",
  };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SignIn 
        routing="path" 
        path={`/${locale}/sign-in`}
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
