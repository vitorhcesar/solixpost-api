import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { EnvService } from "@/http/services/env/env.service";
import { AppError } from "@/http/services/app/errors/app.error";
import { CompleteInstagramConnectUseCase } from "@/app/usecases/instagram/instagram-connected-account.usecases";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { PrismaInstagramOAuthStateRepository } from "@/infra/database/prisma/repositories/prisma-instagram-oauth-state.repository";
import { InstagramOAuthClient } from "@/infra/instagram/instagram-oauth.client";
import { InstagramGraphClient } from "@/infra/instagram/instagram-graph.client";
import { instagramConnectCallbackQuerySchema } from "@/http/validation/schemas/publication.schema";

export class InstagramCallbackRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createPublicRoute();
    const env = EnvService.getInstance();

    const completeInstagramConnectUseCase = new CompleteInstagramConnectUseCase(
      new PrismaInstagramOAuthStateRepository(),
      new PrismaInstagramConnectedAccountRepository(),
      new InstagramOAuthClient(),
      new InstagramGraphClient(),
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
