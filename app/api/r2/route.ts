import { NextRequest, NextResponse } from "next/server";
import { getSignedUrlForR2 } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const key = url.replace("r2://eidyn-garments/", "").replace("r2://eidyn/", "").replace("r2://", "");
    const signedUrl = await getSignedUrlForR2(key);
    
    const response = await fetch(signedUrl);
    if (!response.ok) {
      console.error(`R2 fetch failed with status ${response.status}`);
      return new NextResponse("Failed to fetch image from R2", { status: 502 });
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "image/png");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error("Error generating R2 signed URL:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
