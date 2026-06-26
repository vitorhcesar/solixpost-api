import { getPrismaClient } from "@/infra/database/prisma/client";
import type { PrismaClient } from "../../../../../generated/prisma";

export abstract class BasePrismaRepository {
  protected getPrismaClient(): PrismaClient {
    return getPrismaClient();
  }
}
