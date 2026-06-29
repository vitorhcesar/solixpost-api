import { getAuthContext } from "@/http/client";
import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { GetWalletBalanceUseCase } from "@/app/usecases/wallet/get-wallet-balance.usecase";
import { CreateWalletPixRechargeUseCase } from "@/app/usecases/wallet/create-wallet-pix-recharge.usecase";
import { PrismaWalletRepository } from "@/infra/database/prisma/repositories/prisma-wallet.repository";
import { PrismaUserRepository } from "@/infra/database/prisma/repositories/prisma-user.repository";
import { OmegaPayClient } from "@/infra/omegapay/omegapay.client";
import { createWalletPixRechargeBodySchema } from "@/http/validation/schemas/wallet.schema";

export class WalletRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createUserRoute();
    const walletRepository = new PrismaWalletRepository();
    const userRepository = new PrismaUserRepository();
    const omegaPayClient = new OmegaPayClient();

    const getWalletBalanceUseCase = new GetWalletBalanceUseCase(walletRepository);
    const createWalletPixRechargeUseCase = new CreateWalletPixRechargeUseCase(
      walletRepository,
      userRepository,
      omegaPayClient,
    );

    route.get("/wallet", async (context) => {
      const { authUserId } = getAuthContext(context);
      const wallet = await getWalletBalanceUseCase.execute(authUserId!);
      return this.successResponse("OK", wallet, 200);
    });

    route.post("/wallet/recharges/pix", async (context) => {
      const { authUserId } = getAuthContext(context);
      const body = createWalletPixRechargeBodySchema.parse(context.body);
      const recharge = await createWalletPixRechargeUseCase.execute({
        userId: authUserId!,
        amount: body.amount,
        client: body.client,
      });

      return this.successResponse("Recarga PIX criada", recharge, 201);
    });

    route.get("/wallet/recharges/:rechargeId", async (context) => {
      const { authUserId } = getAuthContext(context);
      const { rechargeId } = context.params;
      const recharge = await createWalletPixRechargeUseCase.getRechargeForUser(
        authUserId!,
        rechargeId,
      );

      return this.successResponse("OK", recharge, 200);
    });

    return route;
  }
}
