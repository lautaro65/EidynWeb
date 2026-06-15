import { getLocale } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await currentUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const membership = await db.membership.findFirst({
    where: { user: { clerkId: user.id } },
    include: { tenant: true }
  });

  if (!membership) {
    redirect(`/${locale}/portal`);
  }

  if (membership.tenant.type === "brand") {
    redirect(`/${locale}/dashboard/brand`);
  } else if (membership.tenant.type === "store") {
    redirect(`/${locale}/dashboard/shop`);
  } else {
    redirect(`/${locale}/portal`);
  }
}
