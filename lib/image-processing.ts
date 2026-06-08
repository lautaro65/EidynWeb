export async function removeBackground(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ REMOVE_BG_API_KEY is missing in environment variables. Uploading original image with background.");
    return { buffer, mimeType };
  }

  try {
    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob to satisfy TypeScript
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    formData.append("image_file", blob, "image.png");
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Remove.bg API Error (${response.status}):`, errorText);
      console.warn("⚠️ Fallback to original image due to Remove.bg API error.");
      return { buffer, mimeType }; // Fallback to original if API fails
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());
    // Remove.bg always returns a transparent PNG
    return { buffer: resultBuffer, mimeType: "image/png" };
  } catch (error) {
    console.error("Error connecting to Remove.bg API:", error);
    console.warn("⚠️ Fallback to original image due to connection error.");
    return { buffer, mimeType };
  }
}
