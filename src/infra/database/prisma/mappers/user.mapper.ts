import type { User as PrismaUser } from "../../../../../generated/prisma";
import { User } from "@/domain/entities/user.entity";
import { AppRoleEnum } from "@/domain/enums/app-role.enum";

export class UserMapper {
  static toDomain(row: PrismaUser): User {
    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image,
      role: UserMapper.toDomainRole(row.role),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private static toDomainRole(role: string): AppRoleEnum {
    if (role === AppRoleEnum.ADMIN) {
      return AppRoleEnum.ADMIN;
    }

    return AppRoleEnum.USER;
  }
}
