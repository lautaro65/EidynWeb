import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SizeGuideForm, SizeGuideInitialData } from "@/components/dashboard/size-guide-form";

interface EditSizeGuidePageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditSizeGuidePage({ params }: EditSizeGuidePageProps) {
  const resolvedParams = await params;
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return notFound();
  }

  const tenantId = (sessionClaims?.metadata as any)?.tenantId as string;
  const finalTenantId = tenantId || (await db.membership.findFirst({
    where: { user: { clerkId: userId } }
  }))?.tenantId;

  if (!finalTenantId) {
    return notFound();
  }

  const sizeGuide = await db.sizeGuide.findUnique({
    where: {
      id: resolvedParams.id,
      tenantId: finalTenantId
    }
  });

  if (!sizeGuide) {
    return notFound();
  }

  // Parse matrix data
  const matrixData = sizeGuide.matrix as any;
  const sizes = matrixData?.sizes || [];
  const matrixValues = matrixData?.values || {};

  const initialData: SizeGuideInitialData = {
    id: sizeGuide.id,
    name: sizeGuide.name || "",
    category: sizeGuide.category || "",
    status: sizeGuide.status || "Draft",
    sizes,
    matrixValues
  };

  return <SizeGuideForm isEditing={true} initialData={initialData} />;
}
