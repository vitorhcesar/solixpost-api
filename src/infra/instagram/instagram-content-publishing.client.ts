import { AppError } from "@/http/services/app/errors/app.error";
import type {
  IPublishMediaInput,
  IPublishMediaResult,
} from "@/domain/instagram/instagram-content-publishing.service";

interface IInstagramContainerResponse {
  id?: string;
  error?: {
    message?: string;
  };
}

interface IInstagramPublishResponse {
  id?: string;
  error?: {
    message?: string;
  };
}

interface IInstagramContainerStatusResponse {
  status_code?: string;
  error?: {
    message?: string;
  };
}

type InstagramContainerStatusCode =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED";

const CONTAINER_POLL_INTERVAL_MS = 3_000;
const CONTAINER_POLL_MAX_ATTEMPTS = 60;

export class InstagramContentPublishingClient {
  async publishPost(input: IPublishMediaInput): Promise<IPublishMediaResult> {
    const containerId = await this.createMediaContainer(input.instagramUserId, {
      accessToken: input.accessToken,
      mediaUrl: input.mediaUrl,
      caption: input.caption,
    });

    await this.waitForContainerReady(containerId, input.accessToken);

    return this.publishContainer(input.instagramUserId, {
      accessToken: input.accessToken,
      containerId,
    });
  }

  async publishStory(input: IPublishMediaInput): Promise<IPublishMediaResult> {
    const containerId = await this.createMediaContainer(input.instagramUserId, {
      accessToken: input.accessToken,
      mediaUrl: input.mediaUrl,
      mediaType: "STORIES",
    });

    await this.waitForContainerReady(containerId, input.accessToken);

    return this.publishContainer(input.instagramUserId, {
      accessToken: input.accessToken,
      containerId,
    });
  }

  private async createMediaContainer(
    instagramUserId: string,
    input: {
      accessToken: string;
      mediaUrl: string;
      caption?: string | null;
      mediaType?: "STORIES";
    },
  ): Promise<string> {
    const body = new URLSearchParams({
      image_url: input.mediaUrl,
      access_token: input.accessToken,
    });

    if (input.caption) {
      body.set("caption", input.caption);
    }

    if (input.mediaType) {
      body.set("media_type", input.mediaType);
    }

    const response = await fetch(
      `https://graph.instagram.com/v21.0/${instagramUserId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const data = (await response.json()) as IInstagramContainerResponse;

    if (!response.ok || !data.id) {
      throw new AppError(
        data.error?.message ?? "Falha ao criar container de mídia no Instagram",
        502,
        "instagram_media_container_failed",
      );
    }

    return data.id;
  }

  private async waitForContainerReady(
    containerId: string,
    accessToken: string,
  ): Promise<void> {
    for (let attempt = 0; attempt < CONTAINER_POLL_MAX_ATTEMPTS; attempt++) {
      const statusCode = await this.getContainerStatusCode(containerId, accessToken);

      if (statusCode === "FINISHED" || statusCode === "PUBLISHED") {
        return;
      }

      if (statusCode === "ERROR") {
        throw new AppError(
          "Falha ao processar mídia no Instagram",
          502,
          "instagram_media_container_processing_failed",
        );
      }

      if (statusCode === "EXPIRED") {
        throw new AppError(
          "O container de mídia expirou antes de ser publicado",
          502,
          "instagram_media_container_expired",
        );
      }

      await this.sleep(CONTAINER_POLL_INTERVAL_MS);
    }

    throw new AppError(
      "Tempo esgotado aguardando processamento da mídia no Instagram",
      504,
      "instagram_media_container_timeout",
    );
  }

  private async getContainerStatusCode(
    containerId: string,
    accessToken: string,
  ): Promise<InstagramContainerStatusCode> {
    const url = new URL(`https://graph.instagram.com/v21.0/${containerId}`);
    url.searchParams.set("fields", "status_code");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url.toString());
    const data = (await response.json()) as IInstagramContainerStatusResponse;

    if (!response.ok || !data.status_code) {
      throw new AppError(
        data.error?.message ?? "Falha ao verificar status do container de mídia",
        502,
        "instagram_media_container_status_failed",
      );
    }

    return data.status_code as InstagramContainerStatusCode;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async publishContainer(
    instagramUserId: string,
    input: {
      accessToken: string;
      containerId: string;
    },
  ): Promise<IPublishMediaResult> {
    const body = new URLSearchParams({
      creation_id: input.containerId,
      access_token: input.accessToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/v21.0/${instagramUserId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const data = (await response.json()) as IInstagramPublishResponse;

    if (!response.ok || !data.id) {
      throw new AppError(
        data.error?.message ?? "Falha ao publicar mídia no Instagram",
        502,
        "instagram_media_publish_failed",
      );
    }

    return {
      instagramMediaId: data.id,
    };
  }
}
