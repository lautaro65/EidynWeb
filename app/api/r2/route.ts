import { NextRequest, NextResponse } from "next/server";
import { getSignedUrlForR2 } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const key = url.replace("r2://eidyn-garments/", "").replace("r2://eidyn/", "");
    const signedUrl = await getSignedUrlForR2(key);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error generating R2 signed URL:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
