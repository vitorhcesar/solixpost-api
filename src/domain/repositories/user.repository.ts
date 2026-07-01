import type { User } from "@/domain/entities/user.entity";
import type { AppRoleEnum } from "@/domain/enums/app-role.enum";

export interface IUserListParams {
  search?: string;
  skip: number;
  take: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(params: IUserListParams): Promise<User[]>;
  count(search?: string): Promise<number>;
  updateRole(id: string, role: AppRoleEnum): Promise<User>;
  markEmailVerified(id: string): Promise<User>;
  deleteById(id: string): Promise<void>;
  countInstagramAccountsByUserId(userId: string): Promise<number>;
}
