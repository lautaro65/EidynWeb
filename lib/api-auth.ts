import { db } from "@/lib/db";

/**
 * Verifies the incoming API request using the Authorization header.
 * Returns the tenantId if successful, otherwise throws an error or returns null.
 */
export async function verifyApiRequest(request: Request): Promise<{ tenantId: string } | { error: string, status: number }> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Missing or invalid Authorization header", status: 401 };
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return { error: "Token not found in Authorization header", status: 401 };
    }

    // For the MVP, the token generated is saved directly in the publicKey field
    // In a production environment with higher security, this token should be hashed
    // and compared against the keyHash field.
    const apiKey = await db.apiKey.findUnique({
      where: {
        publicKey: token,
      },
      select: {
        id: true,
        tenantId: true,
        isActive: true,
      }
    });

    if (!apiKey) {
      return { error: "Invalid API Key", status: 401 };
    }

    if (!apiKey.isActive) {
      return { error: "API Key has been revoked or is inactive", status: 403 };
    }

    // Update lastUsedAt in the background (no need to await it and slow down the request)
    db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(console.error);

    return { tenantId: apiKey.tenantId };
  } catch (error) {
    console.error("Error verifying API request:", error);
    return { error: "Internal Server Error", status: 500 };
  }
}
