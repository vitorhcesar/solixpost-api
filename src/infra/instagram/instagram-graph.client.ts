import { AppError } from "@/http/services/app/errors/app.error";
import type {
  IInstagramGraphService,
  IInstagramProfile,
} from "@/domain/instagram/instagram.service";

interface IInstagramMeResponse {
  user_id?: string;
  id?: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
  error?: {
    message?: string;
    code?: number;
  };
}

export class InstagramGraphClient implements IInstagramGraphService {
  async getProfile(accessToken: string): Promise<IInstagramProfile> {
    const params = new URLSearchParams({
      fields: "user_id,username,name,profile_picture_url",
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/v21.0/me?${params.toString()}`,
    );

    const data = (await response.json()) as IInstagramMeResponse;

    if (!response.ok) {
      throw new AppError(
        data.error?.message ?? "Falha ao obter perfil do Instagram",
        502,
        "instagram_profile_fetch_failed",
      );
    }

    const instagramUserId = data.user_id ?? data.id;

    if (!instagramUserId || !data.username) {
      throw new AppError(
        "Resposta inválida ao obter perfil do Instagram",
        502,
        "instagram_profile_invalid_response",
      );
    }

    return {
      instagramUserId,
      username: data.username,
      displayName: data.name ?? null,
      profilePictureUrl: data.profile_picture_url ?? null,
    };
  }
}
