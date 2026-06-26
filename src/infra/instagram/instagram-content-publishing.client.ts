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

export class InstagramContentPublishingClient {
  async publishPost(input: IPublishMediaInput): Promise<IPublishMediaResult> {
    const containerId = await this.createMediaContainer(input.instagramUserId, {
      accessToken: input.accessToken,
      mediaUrl: input.mediaUrl,
      caption: input.caption,
    });

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
