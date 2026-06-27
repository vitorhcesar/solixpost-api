import {
  CreateAndPublishPublicationUseCase,
  GetPublicationUseCase,
} from "@/app/usecases/publication/create-and-publish-publication.usecase";
import { getAuthContext } from "@/http/client";
import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { AppError } from "@/http/services/app/errors/app.error";
import { EnvService } from "@/http/services/env/env.service";
import { createPublicationBodySchema } from "@/http/validation/schemas/publication.schema";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { PrismaPublicationRepository } from "@/infra/database/prisma/repositories/prisma-publication.repository";
import { MinioTemporaryPublicationMediaStorage } from "@/infra/object-storage/minio-temporary-publication-media.storage";
import { PublicationQueue } from "@/infra/queue/publication-queue";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export class PublicationRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createUserRoute();

    const env = EnvService.getInstance();
    const publicationRepository = new PrismaPublicationRepository();
    const instagramConnectedAccountRepository =
      new PrismaInstagramConnectedAccountRepository();
    const publicationQueue = new PublicationQueue();
    const tempStorage = new MinioTemporaryPublicationMediaStorage();

    const createAndPublishPublicationUseCase =
      new CreateAndPublishPublicationUseCase(
        publicationRepository,
        instagramConnectedAccountRepository,
        publicationQueue,
        env,
      );
    const getPublicationUseCase = new GetPublicationUseCase(
      publicationRepository,
    );

    route.post("/publications/upload-media", async (context) => {
      const { authUserId } = getAuthContext(context);

      const body = context.body as Record<string, unknown> | null;
      const file = (body?.file instanceof File ? body.file : null) as File | null;

      if (!file) {
        throw new AppError("Campo 'file' é obrigatório", 400, "file_required");
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new AppError(
          `Tipo de arquivo não suportado: ${file.type}. Use JPEG, PNG, WebP ou MP4.`,
          400,
          "unsupported_media_type",
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new AppError(
          "O arquivo excede o tamanho máximo de 100 MB",
          400,
          "file_too_large",
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const objectKey = tempStorage.buildObjectKey(authUserId!, file.name);

      await tempStorage.upload({
        objectKey,
        buffer,
        contentType: file.type,
        size: file.size,
      });

      return this.successResponse(
        "Mídia enviada com sucesso",
        { objectKey },
        201,
      );
    });

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

      return this.successResponse("Publicação enfileirada", publication, 202);
    });

    route.get("/publications/:publicationId", async (context) => {
      const { authUserId } = getAuthContext(context);
      const publicationId = context.params.publicationId;

      if (!publicationId) {
        throw new AppError(
          "Publicação inválida",
          400,
          "invalid_publication_id",
        );
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
