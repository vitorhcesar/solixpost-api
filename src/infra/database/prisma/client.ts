import { PrismaClient } from "../../../../generated/prisma";
import { EnvService } from "@/http/services/env/env.service";

let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasourceUrl: EnvService.getInstance().databaseUrl,
      log: EnvService.getInstance().isDevelopment
        ? ["error", "warn"]
        : ["error"],
    });
  }

  return prismaClient;
}

export async function disconnectPrismaClient(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}
