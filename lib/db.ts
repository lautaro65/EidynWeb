import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const normalizePgSslMode = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const sslMode = parsedUrl.searchParams.get("sslmode")?.toLowerCase();

    // Keep current effective behavior and avoid pg v8 warning noise.
    if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
      parsedUrl.searchParams.set("sslmode", "verify-full");
    }

    return parsedUrl.toString();
  } catch {
    return url;
  }
};

const rawConnectionString = process.env.DATABASE_URL;
const hasDatabaseUrl = Boolean(rawConnectionString);

const connectionString = rawConnectionString
  ? normalizePgSslMode(rawConnectionString)
  : undefined;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: true,
    })
  : undefined;

const adapter = pool ? new PrismaPg(pool) : undefined;

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma_v2: PrismaClientSingleton | undefined;
};

const createMissingDbProxy = (): PrismaClientSingleton =>
  new Proxy(
    {},
    {
      get() {
        throw new Error("DATABASE_URL is not set");
      },
    }
  ) as PrismaClientSingleton;

export const db = hasDatabaseUrl
  ? globalForPrisma.prisma_v2 ?? prismaClientSingleton()
  : createMissingDbProxy();

if (hasDatabaseUrl && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_v2 = db;
}
