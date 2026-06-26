import { BasePrismaRepository } from "@/infra/database/prisma/repositories/base-prisma.repository";
import type { IInstagramOAuthStateRepository } from "@/domain/repositories/instagram-connected-account.repository";

export class PrismaInstagramOAuthStateRepository
  extends BasePrismaRepository
  implements IInstagramOAuthStateRepository
{
  async create(userId: string, state: string, expiresAt: Date): Promise<void> {
    await this.getPrismaClient().instagramOAuthState.create({
      data: {
        userId,
        state,
        expiresAt,
      },
    });
  }

  async findValidState(state: string): Promise<{ userId: string } | null> {
    const row = await this.getPrismaClient().instagramOAuthState.findFirst({
      where: {
        state,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return row ? { userId: row.userId } : null;
  }

  async deleteByState(state: string): Promise<void> {
    await this.getPrismaClient().instagramOAuthState.deleteMany({
      where: { state },
    });
  }
}
