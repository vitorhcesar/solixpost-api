import type { User } from "@/domain/entities/user.entity";
import type { IUserDto } from "@/app/usecases/user/dto/user.dto";

export function mapUserToDto(user: User): IUserDto {
  const data = user.toObject();

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    emailVerified: data.emailVerified,
    image: data.image,
    role: data.role,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}
