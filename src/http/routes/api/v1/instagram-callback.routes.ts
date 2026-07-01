import { CompleteInstagramConnectUseCase } from "@/app/usecases/instagram/instagram-connected-account.usecases";
import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { AppError } from "@/http/services/app/errors/app.error";
import { EnvService } from "@/http/services/env/env.service";
import { instagramConnectCallbackQuerySchema } from "@/http/validation/schemas/publication.schema";
import { PrismaAccountSlotRepository } from "@/infra/database/prisma/repositories/prisma-account-slot.repository";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { PrismaInstagramOAuthStateRepository } from "@/infra/database/prisma/repositories/prisma-instagram-oauth-state.repository";
import { InstagramGraphClient } from "@/infra/instagram/instagram-graph.client";
import { InstagramOAuthClient } from "@/infra/instagram/instagram-oauth.client";

export class InstagramCallbackRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createPublicRoute();
    const env = EnvService.getInstance();

    const completeInstagramConnectUseCase = new CompleteInstagramConnectUseCase(
      new PrismaInstagramOAuthStateRepository(),
      new PrismaInstagramConnectedAccountRepository(),
      new InstagramOAuthClient(),
      new InstagramGraphClient(),
      new PrismaAccountSlotRepository(),
    );

    route.get("/instagram/connect/callback", async (context) => {
      const parsedQuery = instagramConnectCallbackQuerySchema.safeParse(
        context.query,
      );

      if (!parsedQuery.success) {
        throw new AppError("Parâmetros OAuth inválidos", 400, "validation");
      }

      await completeInstagramConnectUseCase.execute(parsedQuery.data);

      const redirectUrl = new URL("/instagram/connect/success", env.corsOrigin);

      return Response.redirect(redirectUrl.toString(), 302);
    });

    return route;
  }
}
