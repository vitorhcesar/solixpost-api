import type { InstagramConnectedAccount } from "@/domain/entities/instagram-connected-account.entity";

export interface IInstagramConnectedAccountRepository {
  findById(id: string): Promise<InstagramConnectedAccount | null>;
  findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<InstagramConnectedAccount | null>;
  findByUserId(userId: string): Promise<InstagramConnectedAccount[]>;
  findByUserIdAndInstagramUserId(
    userId: string,
    instagramUserId: string,
  ): Promise<InstagramConnectedAccount | null>;
  save(account: InstagramConnectedAccount): Promise<InstagramConnectedAccount>;
}

export interface IInstagramOAuthStateRepository {
  create(userId: string, state: string, expiresAt: Date): Promise<void>;
  findValidState(state: string): Promise<{ userId: string } | null>;
  deleteByState(state: string): Promise<void>;
}
