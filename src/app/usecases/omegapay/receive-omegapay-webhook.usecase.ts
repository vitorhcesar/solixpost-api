import type { IOmegaPayWebhookPayload, IOmegaPayWebhookReceipt } from "@/domain/acquirer/omegapay-webhook";
import type { IOmegaPayWebhookRepository } from "@/domain/repositories/omegapay-webhook.repository";
import { ProcessWalletRechargeFromWebhookUseCase } from "@/app/usecases/wallet/process-wallet-recharge-from-webhook.usecase";

export class ReceiveOmegaPayWebhookUseCase {
  constructor(
    private readonly omegaPayWebhookRepository: IOmegaPayWebhookRepository,
    private readonly processWalletRechargeFromWebhookUseCase: ProcessWalletRechargeFromWebhookUseCase,
  ) {}

  async execute(payload: IOmegaPayWebhookPayload): Promise<IOmegaPayWebhookReceipt> {
    const receipt = await this.omegaPayWebhookRepository.save(payload);

    const transactionId =
      typeof payload.transaction?.id === "string"
        ? payload.transaction.id
        : undefined;

    console.info("[OmegaPay Webhook] Recebido", {
      id: receipt.id,
      event: receipt.event,
      transactionId,
      receivedAt: receipt.receivedAt.toISOString(),
    });

    try {
      await this.processWalletRechargeFromWebhookUseCase.execute(payload);
    } catch (error) {
      console.error("[OmegaPay Webhook] Falha ao processar recarga de carteira", {
        webhookId: receipt.id,
        event: receipt.event,
        error,
      });
    }

    return receipt;
  }
}
