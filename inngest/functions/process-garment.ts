import { inngest } from "../client";
import { db as prisma } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { NodeIO } from '@gltf-transform/core';
import { simplify, draco } from '@gltf-transform/functions';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
// @ts-expect-error - No types available for draco3dgltf
import draco3d from 'draco3dgltf';
import { MeshoptSimplifier } from 'meshoptimizer';

export const processGarment = inngest.createFunction(
  {
    id: "process-garment-3d",
    triggers: [{ event: "garment.process" }]
  },
  async ({ event, step }) => {
    const { aiJobId, templateId } = event.data;

    // 1. Iniciar la tarea (MOCK)
    const meshyTaskId = await step.run("start-meshy-task", async () => {
      await prisma.aiJob.update({
        where: { id: aiJobId },
        data: { status: "processing", startedAt: new Date() }
      });
      await prisma.garmentTemplate.update({
        where: { id: templateId },
        data: { status: "processing" }
      });
      return "mock_task_id";
    });

    // 2. Simular espera (MOCK)
    await step.sleep("wait-for-meshy", "2s");

    // 3. Descargar, Optimizar GLB y subir a R2
    const finalUrls = await step.run("optimize-and-upload-r2", async () => {
      // MOCK: En lugar de descargar de Meshy, leemos el modelo local
      const path = await import("path");
      const fs = await import("fs/promises");
      const localGlbPath = path.join(process.cwd(), "public", "models", "remera.glb");
      const localBuffer = await fs.readFile(localGlbPath);
      const arrayBuffer = localBuffer.buffer.slice(localBuffer.byteOffset, localBuffer.byteOffset + localBuffer.byteLength);

      // B. Optimización con gltf-transform
      await MeshoptSimplifier.ready;
      const io = new NodeIO()
        .registerExtensions(KHRONOS_EXTENSIONS)
        .registerDependencies({
          'draco3d.decoder': await draco3d.createDecoderModule(),
          'draco3d.encoder': await draco3d.createEncoderModule(),
        });

      // Leemos el GLB original
      const document = await io.readBinary(new Uint8Array(arrayBuffer));

      // Aplicamos compresión y decimación
      await document.transform(
        simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.01 }), // Reduce al 50% los polígonos
        draco({ method: 'edgebreaker', quantizePosition: 14 }) // Compresión Draco
      );

      // Generamos el buffer optimizado
      const optimizedGlb = await io.writeBinary(document);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalBuffer: any = Buffer.from(optimizedGlb);

      // C. Auto-Rigging
      const { autoRigGarment } = await import("@/lib/rigging");

      try {
        const prefabPath = path.join(process.cwd(), "public", "models", "prefab_base.glb");
        // Verifica si existe el prefab
        await fs.access(prefabPath);
        const prefabBuffer = await fs.readFile(prefabPath);
        
        console.log("Prefab found. Starting auto-rigging process...");
        finalBuffer = (await autoRigGarment(finalBuffer as unknown as Uint8Array, prefabBuffer as unknown as Uint8Array)) as unknown as Buffer;
        console.log("Auto-rigging completed successfully.");
      } catch (err) {
        console.warn("Skipping auto-rigging. prefab_base.glb not found at public/models/prefab_base.glb or rigging failed.", err);
      }

      // D. Subimos a R2
      const r2Key = `garments/${templateId}/base/model.glb`;
      const uploadedUrl = await uploadToR2(finalBuffer, r2Key, "model/gltf-binary");

      return { baseModelUrl: uploadedUrl };
    });

    // 4. Actualizar Base de Datos
    await step.run("update-database", async () => {
      await prisma.garmentTemplate.update({
        where: { id: templateId },
        data: {
          baseModelUrl: finalUrls.baseModelUrl,
          status: "base_ready"
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
