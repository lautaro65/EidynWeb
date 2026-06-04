import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
export const bucketName = process.env.R2_BUCKET_NAME || "eidyn-garments";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Subir un archivo (Buffer o Blob) a Cloudflare R2
 */
export async function uploadToR2(
  file: Buffer | Uint8Array | string,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await r2.send(command);
  return `r2://${bucketName}/${key}`; // Retornamos un URI interno o podemos retornar el key simplemente. Usaremos url plana.
}

/**
 * Generar URL firmada temporal para lectura
 * Expira en 1 hora por defecto (3600 segundos)
 */
export async function getSignedUrlForR2(key: string, expiresIn = 3600): Promise<string> {
  // Limpiamos la key si viene con el prefijo bucketName
  const cleanKey = key.replace(`r2://${bucketName}/`, "");
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
  });

  return getSignedUrl(r2, command, { expiresIn });
}
