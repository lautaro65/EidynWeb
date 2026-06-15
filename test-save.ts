import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { db } from "./lib/db";

async function main() {
  try {
    // Buscar la primer marca en la DB
    const membership = await db.membership.findFirst({
      where: { tenant: { type: "brand" } },
      include: { tenant: true },
    });

    if (!membership) {
      console.log("❌ No se encontró ninguna marca en la DB.");
      return;
    }

    console.log(`✅ Marca encontrada: ${membership.tenant.name} (ID: ${membership.tenantId})`);

    // El payload simulado desde el frontend (con medidas vacías para probar el bug fix)
    const payload = {
      sku: "TEST-HOODIE-001",
      name: "Hoodie de Prueba Automatizada",
      category: "hoodie",
      gender: "unisex",
      description: "Este es un modelo generado automáticamente para probar la transacción de Prisma.",
      status: "completed",
      components: {
        hoodType: "hoodStandard",
        pocketType: "pocketKangaroo",
        cuffType: "cuffRibbed",
        hemType: "hemRibbed"
      },
      sizing: {
        baseSizeName: "M",
        system: "alpha",
        chart: {
          "S": {
            measureChest: 50,
            measureLength: 68,
            measureSleeve: 64,
            measureShoulder: 45,
            measureCollar: "", // Probando el error de string vacío
            measureHem: "",
            measureWaist: "",
            measureFrontLength: "",
            measureBackLength: "",
            measureBicep: "",
            measureWrist: "",
            measureArmhole: ""
          },
          "M": {
            measureChest: 54,
            measureLength: 70,
            measureSleeve: 65,
            measureShoulder: 47,
            measureCollar: "",
            measureHem: "",
            measureWaist: "",
            measureFrontLength: "",
            measureBackLength: "",
            measureBicep: "",
            measureWrist: "",
            measureArmhole: ""
          }
        }
      },
      variants: [
        {
          name: "Negro Clásico",
          color: "#000000",
          frontImageUrl: "", // Probando imagen vacía
          backImageUrl: "",
          generatedTextureUrl: "",
          generatedBackTextureUrl: ""
        },
        {
          name: "Rojo Fuego",
          color: "#ff0000",
          frontImageUrl: "",
          backImageUrl: "",
          generatedTextureUrl: "",
          generatedBackTextureUrl: ""
        }
      ]
    };

    console.log("📦 Iniciando transacción de guardado...");

    // La misma lógica de actions.ts
    const parseMeasure = (val: unknown) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const result = await db.$transaction(async (tx) => {
      // 1. Create the GarmentTemplate
      const garment = await tx.garmentTemplate.create({
        data: {
          ownerId: membership.tenantId,
          sku: payload.sku,
          name: payload.name,
          category: payload.category,
          gender: payload.gender,
          description: payload.description || null,
          componentsData: payload.components,
          status: payload.status || "draft", 
        },
      });

      // 2. Create the Sizes
      const sizesToCreate = Object.entries(payload.sizing.chart).map(([sizeLabel, measurements]) => ({
        garmentId: garment.id,
        label: sizeLabel,
        system: payload.sizing.system,
        isBase: sizeLabel === payload.sizing.baseSizeName,
        chest: parseMeasure(measurements.measureChest),
        length: parseMeasure(measurements.measureLength),
        sleeve: parseMeasure(measurements.measureSleeve),
        shoulders: parseMeasure(measurements.measureShoulder),
        collar: parseMeasure(measurements.measureCollar),
        hem: parseMeasure(measurements.measureHem),
        waist: parseMeasure(measurements.measureWaist),
        frontLength: parseMeasure(measurements.measureFrontLength),
        backLength: parseMeasure(measurements.measureBackLength),
        bicep: parseMeasure(measurements.measureBicep),
        wrist: parseMeasure(measurements.measureWrist),
        armhole: parseMeasure(measurements.measureArmhole),
      }));

      await tx.garmentSize.createMany({
        data: sizesToCreate
      });

      // 3. Create the Variants
      const variantsToCreate = payload.variants.map((v) => ({
        garmentId: garment.id,
        name: v.name,
        type: "color",
        colorHex: v.color,
        frontImageUrl: v.frontImageUrl || null,
        backImageUrl: v.backImageUrl || null,
        textureUrl: v.generatedTextureUrl || null,
        backTextureUrl: v.generatedBackTextureUrl || null,
        status: "completed"
      }));

      await tx.garmentVariant.createMany({
        data: variantsToCreate
      });

      return garment;
    });

    console.log(`🎉 ¡Transacción exitosa!`);
    console.log(`👕 Prenda creada con ID: ${result.id}`);

    // Limpieza opcional para no ensuciar la base de datos
    console.log(`🧹 Limpiando la prenda de prueba de la base de datos...`);
    await db.garmentVariant.deleteMany({ where: { garmentId: result.id }});
    await db.garmentSize.deleteMany({ where: { garmentId: result.id }});
    await db.garmentTemplate.delete({ where: { id: result.id }});
    console.log(`✅ Base de datos limpia.`);

  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
