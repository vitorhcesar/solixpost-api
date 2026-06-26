import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { getAuthContext } from "@/http/client";
import { AppError } from "@/http/services/app/errors/app.error";
import {
  CreateAndPublishPublicationUseCase,
  GetPublicationUseCase,
} from "@/app/usecases/publication/create-and-publish-publication.usecase";
import { PrismaPublicationRepository } from "@/infra/database/prisma/repositories/prisma-publication.repository";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { InstagramContentPublishingService } from "@/infra/instagram/instagram-content-publishing.service";
import { InstagramOAuthClient } from "@/infra/instagram/instagram-oauth.client";
import { createPublicationBodySchema } from "@/http/validation/schemas/publication.schema";

export class PublicationRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createUserRoute();

    const publicationRepository = new PrismaPublicationRepository();
    const instagramConnectedAccountRepository =
      new PrismaInstagramConnectedAccountRepository();
    const instagramContentPublishingService = new InstagramContentPublishingService();
    const instagramOAuthService = new InstagramOAuthClient();

    const createAndPublishPublicationUseCase = new CreateAndPublishPublicationUseCase(
      publicationRepository,
      instagramConnectedAccountRepository,
      instagramContentPublishingService,
      instagramOAuthService,
    );
    const getPublicationUseCase = new GetPublicationUseCase(publicationRepository);

    route.post("/publications", async (context) => {
      const { authUserId } = getAuthContext(context);
      const parsedBody = createPublicationBodySchema.safeParse(context.body);

      if (!parsedBody.success) {
        throw new AppError("Dados inválidos", 400, "validation", {
          issues: parsedBody.error.flatten(),
        });
      }

      const publication = await createAndPublishPublicationUseCase.execute(
        authUserId!,
        parsedBody.data,
      );

      return this.successResponse("Publicação processada", publication, 201);
    });

    route.get("/publications/:publicationId", async (context) => {
      const { authUserId } = getAuthContext(context);
      const publicationId = context.params.publicationId;

      if (!publicationId) {
        throw new AppError("Publicação inválida", 400, "invalid_publication_id");
      }

      const publication = await getPublicationUseCase.execute(
        authUserId!,
        publicationId,
      );

      return this.successResponse("OK", publication, 200);
    });

    return route;
  }
}
