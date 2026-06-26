import { BasePrismaRepository } from "@/infra/database/prisma/repositories/base-prisma.repository";
import { UserMapper } from "@/infra/database/prisma/mappers/user.mapper";
import type { User } from "@/domain/entities/user.entity";
import type { IUserRepository } from "@/domain/repositories/user.repository";

export class PrismaUserRepository
  extends BasePrismaRepository
  implements IUserRepository
{
  async findById(id: string): Promise<User | null> {
    const row = await this.getPrismaClient().user.findUnique({
      where: { id },
    });

    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.getPrismaClient().user.findUnique({
      where: { email },
    });

    return row ? UserMapper.toDomain(row) : null;
  }
}
