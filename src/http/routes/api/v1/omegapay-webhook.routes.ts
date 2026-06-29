import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { AppError } from "@/http/services/app/errors/app.error";
import { ReceiveOmegaPayWebhookUseCase } from "@/app/usecases/omegapay/receive-omegapay-webhook.usecase";
import { ProcessWalletRechargeFromWebhookUseCase } from "@/app/usecases/wallet/process-wallet-recharge-from-webhook.usecase";
import { PrismaOmegaPayWebhookRepository } from "@/infra/database/prisma/repositories/prisma-omegapay-webhook.repository";
import { PrismaWalletRepository } from "@/infra/database/prisma/repositories/prisma-wallet.repository";
import { omegaPayWebhookBodySchema } from "@/http/validation/schemas/omegapay-webhook.schema";

export class OmegaPayWebhookRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createPublicRoute();

    const receiveOmegaPayWebhookUseCase = new ReceiveOmegaPayWebhookUseCase(
      new PrismaOmegaPayWebhookRepository(),
      new ProcessWalletRechargeFromWebhookUseCase(new PrismaWalletRepository()),
    );

    route.post("/webhooks/omegapay", async ({ body }) => {
      const parsedBody = omegaPayWebhookBodySchema.safeParse(body);

      if (!parsedBody.success) {
        throw new AppError(
          "Payload de webhook OmegaPay inválido",
          400,
          "validation",
          { issues: parsedBody.error.flatten() },
        );
      }

      const receipt = await receiveOmegaPayWebhookUseCase.execute(parsedBody.data);

      return this.successResponse("Webhook OmegaPay recebido", receipt, 200);
    });

    return route;
  }
}
