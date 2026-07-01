import { randomBytes } from "node:crypto";
import type { IAccountSlotRepository } from "@/domain/repositories/account-slot.repository";
import type { IInstagramConnectedAccountRepository } from "@/domain/repositories/instagram-connected-account.repository";

export interface IInstagramDataDeletionResult {
  confirmationCode: string;
  statusUrl: string;
}

export class HandleInstagramMetaComplianceUseCase {
  constructor(
    private readonly instagramConnectedAccountRepository: IInstagramConnectedAccountRepository,
    private readonly accountSlotRepository: IAccountSlotRepository,
    private readonly frontendOrigin: string,
  ) {}

  async deauthorizeByInstagramUserId(instagramUserId: string): Promise<void> {
    await this.disconnectAllByInstagramUserId(instagramUserId);
  }

  async dataDeletionByInstagramUserId(
    instagramUserId: string,
  ): Promise<IInstagramDataDeletionResult> {
    await this.disconnectAllByInstagramUserId(instagramUserId);

    const confirmationCode = randomBytes(12).toString("hex");
    const statusUrl = new URL("/privacy", this.frontendOrigin);
    statusUrl.searchParams.set("deletion", confirmationCode);

    return {
      confirmationCode,
      statusUrl: statusUrl.toString(),
    };
  }

  private async disconnectAllByInstagramUserId(
    instagramUserId: string,
  ): Promise<void> {
    const accounts =
      await this.instagramConnectedAccountRepository.findAllByInstagramUserId(
        instagramUserId,
      );

    for (const account of accounts) {
      account.markAsDisconnected();
      await this.instagramConnectedAccountRepository.save(account);

      if (account.id) {
        await this.accountSlotRepository.releaseAccount(account.id);
      }
    }
  }
}
