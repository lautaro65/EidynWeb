import { inngest } from "../client";
import { db as prisma } from "@/lib/db";
import { createMeshyTask, checkMeshyTaskStatus } from "@/lib/meshy";
import { uploadToR2 } from "@/lib/r2";

export const processGarment = inngest.createFunction(
  {
    id: "process-garment-3d",
    triggers: [{ event: "garment.process" }]
  },
  async ({ event, step }) => {
    const { aiJobId, variantId, sourceImageUrl } = event.data;

    // 1. Iniciar la tarea en Meshy
    const meshyTaskId = await step.run("start-meshy-task", async () => {
      // Actualizamos estado a processing
      await prisma.aiJob.update({
        where: { id: aiJobId },
        data: { status: "processing", startedAt: new Date() }
      });
      await prisma.garmentVariant.update({
        where: { id: variantId },
        data: { status: "processing" }
      });

      return await createMeshyTask(sourceImageUrl);
    });

    // 2. Hacer polling con Inngest step.sleep (Evita timeouts de Vercel)
    let isCompleted = false;
    let statusData;
    let attempts = 0;
    
    while (!isCompleted && attempts < 30) {
      await step.sleep(`wait-for-meshy-${attempts}`, "15s"); // Esperamos 15s sin consumir CPU
      
      statusData = await step.run(`check-meshy-status-${attempts}`, async () => {
        return await checkMeshyTaskStatus(meshyTaskId);
      });

      if (statusData.status === "SUCCEEDED" || statusData.status === "FAILED" || statusData.status === "EXPIRED") {
        isCompleted = true;
      }
      attempts++;
    }
      
    if (statusData?.status !== "SUCCEEDED") {
      throw new Error(`Meshy task failed or timed out: ${statusData?.task_error?.message || "Unknown error"}`);
    }

    // 3. Descargar GLB y subir a R2
    const finalUrls = await step.run("upload-to-r2", async () => {
      const glbUrl = statusData.model_urls.glb;
      
      // Descargamos de Meshy
      const response = await fetch(glbUrl);
      if (!response.ok) throw new Error("Failed to download GLB from Meshy");
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Obtenemos el variant para sacar el garmentId
      const variant = await prisma.garmentVariant.findUnique({ where: { id: variantId } });
      if (!variant) throw new Error("Variant not found");

      const r2Key = `garments/${variant.garmentId}/base/model_${variantId}.glb`;
      const uploadedUrl = await uploadToR2(buffer, r2Key, "model/gltf-binary");

      return { baseModelUrl: uploadedUrl };
    });

    // 4. Actualizar Base de Datos
    await step.run("update-database", async () => {
      // Para el MVP extraemos medidas dummy, pero idealmente vendrían de otro AiJob (garment_params)
      const meshParams = {
        shoulders: 44,
        chest: 96,
        length: 70,
        sleeve: 62,
        sizeLabel: "M", // Suponiendo base
        scaleReference: true
      };

      await prisma.garmentVariant.update({
        where: { id: variantId },
        data: {
          baseModelUrl: finalUrls.baseModelUrl,
          status: "completed",
          meshParams
        }
      });

      await prisma.aiJob.update({
        where: { id: aiJobId },
        data: {
          status: "completed",
          completedAt: new Date(),
          outputData: {
            baseModelUrl: finalUrls.baseModelUrl,
            meshyTaskId
          }
        }
      });
    });

    return { success: true, baseModelUrl: finalUrls.baseModelUrl };
  }
);
