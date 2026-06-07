import { db } from "./lib/db";

async function main() {
  const result = await db.garmentTemplate.updateMany({
    where: { baseModelUrl: null },
    data: { baseModelUrl: '/models/remera.glb' }
  });
  console.log("Updated garments:", result.count);
}

main().finally();
