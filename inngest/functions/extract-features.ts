import { inngest } from "../client";
import { db } from "@/lib/db";

// Función simulada (MOCK) para extracción de IA
export const extractFeatures = inngest.createFunction(
  {
    id: "garment-extract-features",
    name: "AI Feature Extraction",
    triggers: [{ event: "garment.extract-features" }]
  },
  async ({ event, step }) => {
    const { variantId, frontUrl, backUrl } = event.data;

    if (!frontUrl && !backUrl) {
      return { status: "skipped", message: "No images provided" };
    }

    // Paso 1: Simular llamada a OpenAI Vision para obtener el color
    const extractedColor = await step.run("mock-ai-vision-color", async () => {
      // Aquí en el futuro harías un fetch a la API de OpenAI
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simula tiempo de red
      
      // Simulamos que la IA detecta que la remera es azul marino
      return "#1e3a8a"; // Tailwind blue-900
    });

    // Paso 2: Simular llamada a Segment Anything / Meshy para obtener el logo
    const extractedLogo = await step.run("mock-ai-segmentation", async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simula procesamiento pesado
      
      // Simulamos que extrae un logo transparente y lo sube a R2
      // Por ahora usamos un placeholder transparente
      return "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png";
    });

    // Paso 3: Guardar los resultados en la base de datos
    await step.run("save-extracted-features", async () => {
      await db.garmentVariant.update({
        where: { id: variantId },
        data: {
          colorHex: extractedColor,
          textureMapUrl: extractedLogo // Guardamos el logo transparente extraído como textura principal/decal
        }
      });
    });

    return { 
      status: "completed", 
      color: extractedColor, 
      logo: extractedLogo 
    };
  }
);
