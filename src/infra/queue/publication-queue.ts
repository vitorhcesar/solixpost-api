import { Queue, Worker, type Job } from "bullmq";
import { EnvService } from "@/http/services/env/env.service";
import { PrismaPublicationRepository } from "@/infra/database/prisma/repositories/prisma-publication.repository";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { InstagramContentPublishingService } from "@/infra/instagram/instagram-content-publishing.service";
import { InstagramOAuthClient } from "@/infra/instagram/instagram-oauth.client";
import { MinioTemporaryPublicationMediaStorage } from "@/infra/object-storage/minio-temporary-publication-media.storage";
import { PublicationTypeEnum } from "@/domain/enums/instagram.enum";
import { AppError } from "@/http/services/app/errors/app.error";

export const PUBLICATION_QUEUE_NAME = "publication";

export interface IPublicationJobData {
  publicationId: string;
}

function buildRedisConnection() {
  const env = EnvService.getInstance();
  return { host: env.redisHost, port: env.redisPort };
}

export class PublicationQueue {
  private readonly queue: Queue<IPublicationJobData>;

  constructor() {
    this.queue = new Queue<IPublicationJobData>(PUBLICATION_QUEUE_NAME, {
      connection: buildRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  async enqueue(publicationId: string): Promise<void> {
    await this.queue.add(
      "process-publication",
      { publicationId },
      { jobId: `publication_${publicationId}` },
    );
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export class PublicationWorker {
  private readonly worker: Worker<IPublicationJobData>;

  constructor() {
    this.worker = new Worker<IPublicationJobData>(
      PUBLICATION_QUEUE_NAME,
      (job) => this.process(job),
      {
        connection: buildRedisConnection(),
        concurrency: 5,
      },
    );

    this.worker.on("failed", (job, error) => {
      console.error(
        `[PublicationWorker] Job ${job?.id} falhou:`,
        error.message,
      );
    });
  }

  private async process(job: Job<IPublicationJobData>): Promise<void> {
    const { publicationId } = job.data;

    const publicationRepository = new PrismaPublicationRepository();
    const accountRepository = new PrismaInstagramConnectedAccountRepository();
    const publishingService = new InstagramContentPublishingService();
    const oauthService = new InstagramOAuthClient();
    const tempStorage = new MinioTemporaryPublicationMediaStorage();

    const publication = await publicationRepository.findById(publicationId);

    if (!publication) {
      throw new Error(`Publicação ${publicationId} não encontrada`);
    }

    publication.markAsProcessing();
    await publicationRepository.save(publication);

    for (const target of publication.targets) {
      const account = await accountRepository.findById(
        target.instagramConnectedAccountId,
      );

      if (!account || !account.isConnected()) {
        target.markAsFailed("Conta Instagram indisponível");
        continue;
      }

      target.markAsProcessing();

      try {
        let accessToken = account.accessToken;

        if (account.isTokenExpired()) {
          const refreshed = await oauthService.refreshLongLivedToken(accessToken);
          accessToken = refreshed.accessToken;
          account.updateOAuthData({
            accessToken,
            tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
            scopes: refreshed.scopes.length ? refreshed.scopes : account.scopes,
            username: account.username,
            displayName: account.displayName,
            profilePictureUrl: account.profilePictureUrl,
          });
          await accountRepository.save(account);
        }

        const publishInput = {
          instagramUserId: account.instagramUserId,
          accessToken,
          mediaUrl: publication.mediaUrl,
          caption: publication.caption,
        };

        const result =
          publication.type === PublicationTypeEnum.STORY
            ? await publishingService.publishStory(publishInput)
            : await publishingService.publishPost(publishInput);

        target.markAsSuccess(result.instagramMediaId, result.instagramPermalink);
      } catch (error) {
        const message =
          error instanceof AppError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Falha ao publicar no Instagram";

        target.markAsFailed(message);
      }
    }

    publication.replaceTargets(publication.targets);
    publication.finalizeStatus();

    const objectKeyToDelete = publication.objectKey;
    publication.clearObjectKey();

    await publicationRepository.save(publication);

    if (objectKeyToDelete) {
      await tempStorage.delete(objectKeyToDelete).catch((err: unknown) => {
        console.error(
          `[PublicationWorker] Falha ao deletar mídia temporária ${objectKeyToDelete}:`,
          err,
        );
      });
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
