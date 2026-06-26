import { AppError } from "@/http/services/app/errors/app.error";
import { EnvService } from "@/http/services/env/env.service";
import type {
  IInstagramOAuthService,
  IInstagramOAuthTokens,
} from "@/domain/instagram/instagram.service";

interface IInstagramShortLivedTokenResponse {
  access_token: string;
  user_id: number | string;
  permissions?: string[];
}

interface IInstagramLongLivedTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
}

export class InstagramOAuthClient implements IInstagramOAuthService {
  private readonly env = EnvService.getInstance();

  buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.env.instagramAppId,
      redirect_uri: this.env.instagramRedirectUri,
      response_type: "code",
      scope: this.env.instagramOAuthScopes,
      state,
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeAuthorizationCode(code: string): Promise<IInstagramOAuthTokens> {
    const shortLivedToken = await this.requestShortLivedToken(code);
    const longLivedToken = await this.exchangeForLongLivedToken(
      shortLivedToken.access_token,
    );

    return {
      accessToken: longLivedToken.access_token,
      expiresIn: longLivedToken.expires_in,
      instagramUserId: String(shortLivedToken.user_id),
      scopes: shortLivedToken.permissions ?? this.env.instagramOAuthScopes.split(","),
    };
  }

  async refreshLongLivedToken(
    accessToken: string,
  ): Promise<IInstagramOAuthTokens> {
    const params = new URLSearchParams({
      grant_type: "ig_refresh_token",
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?${params.toString()}`,
    );
    const data = (await response.json()) as IInstagramLongLivedTokenResponse & {
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new AppError(
        data.error?.message ?? "Falha ao renovar token do Instagram",
        502,
        "instagram_token_refresh_failed",
      );
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      instagramUserId: "",
      scopes: this.env.instagramOAuthScopes.split(","),
    };
  }

  private async requestShortLivedToken(
    code: string,
  ): Promise<IInstagramShortLivedTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.env.instagramAppId,
      client_secret: this.env.instagramAppSecret,
      grant_type: "authorization_code",
      redirect_uri: this.env.instagramRedirectUri,
      code,
    });

    const response = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = (await response.json()) as IInstagramShortLivedTokenResponse & {
      error_message?: string;
      error_type?: string;
    };

    if (!response.ok) {
      throw new AppError(
        data.error_message ?? "Falha ao trocar código OAuth do Instagram",
        502,
        "instagram_oauth_exchange_failed",
      );
    }

    return data;
  }

  private async exchangeForLongLivedToken(
    shortLivedAccessToken: string,
  ): Promise<IInstagramLongLivedTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: this.env.instagramAppSecret,
      access_token: shortLivedAccessToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/access_token?${params.toString()}`,
    );

    const data = (await response.json()) as IInstagramLongLivedTokenResponse & {
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new AppError(
        data.error?.message ?? "Falha ao obter token de longa duração",
        502,
        "instagram_long_lived_token_failed",
      );
    }

    return data;
  }
}
