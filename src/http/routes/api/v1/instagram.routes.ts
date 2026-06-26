import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { getAuthContext } from "@/http/client";
import { AppError } from "@/http/services/app/errors/app.error";
import {
  CreateInstagramConnectSessionUseCase,
  DisconnectInstagramAccountUseCase,
  ListInstagramConnectedAccountsUseCase,
} from "@/app/usecases/instagram/instagram-connected-account.usecases";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { PrismaInstagramOAuthStateRepository } from "@/infra/database/prisma/repositories/prisma-instagram-oauth-state.repository";
import { InstagramOAuthClient } from "@/infra/instagram/instagram-oauth.client";

export class InstagramRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createUserRoute();

    const instagramConnectedAccountRepository =
      new PrismaInstagramConnectedAccountRepository();
    const instagramOAuthStateRepository = new PrismaInstagramOAuthStateRepository();
    const instagramOAuthService = new InstagramOAuthClient();

    const createInstagramConnectSessionUseCase =
      new CreateInstagramConnectSessionUseCase(
        instagramOAuthStateRepository,
        instagramOAuthService,
      );
    const listInstagramConnectedAccountsUseCase =
      new ListInstagramConnectedAccountsUseCase(
        instagramConnectedAccountRepository,
      );
    const disconnectInstagramAccountUseCase = new DisconnectInstagramAccountUseCase(
      instagramConnectedAccountRepository,
    );

    route.get("/instagram/connect", async (context) => {
      const { authUserId } = getAuthContext(context);
      const session = await createInstagramConnectSessionUseCase.execute(
        authUserId!,
      );

      return this.successResponse("OK", session, 200);
    });

    route.get("/instagram/accounts", async (context) => {
      const { authUserId } = getAuthContext(context);
      const accounts = await listInstagramConnectedAccountsUseCase.execute(
        authUserId!,
      );

      return this.successResponse("OK", accounts, 200);
    });

    route.delete("/instagram/accounts/:accountId", async (context) => {
      const { authUserId } = getAuthContext(context);
      const accountId = context.params.accountId;

      if (!accountId) {
        throw new AppError("Conta Instagram inválida", 400, "invalid_account_id");
      }

      await disconnectInstagramAccountUseCase.execute(authUserId!, accountId);

      return this.successResponse("Conta desconectada com sucesso", null, 200);
    });

    return route;
  }
}
