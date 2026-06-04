import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SignUp 
        routing="path" 
        path={`/${locale}/sign-up`}
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
