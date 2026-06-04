import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processGarment } from "@/inngest/functions/process-garment";
import { extractFeatures } from "@/inngest/functions/extract-features";

// Sirve la API de Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processGarment,
    extractFeatures,
  ],
});
