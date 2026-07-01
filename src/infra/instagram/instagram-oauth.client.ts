import { AppError } from "@/http/services/app/errors/app.error";
import { EnvService } from "@/http/services/env/env.service";
import type {
  IInstagramOAuthService,
  IInstagramOAuthTokens,
} from "@/domain/instagram/instagram.service";

interface IInstagramShortLivedTokenPayload {
  access_token: string;
  user_id: number | string;
  permissions?: string | string[];
}

interface IInstagramShortLivedTokenResponse {
  access_token: string;
  user_id: number | string;
  permissions?: string[];
}

interface IInstagramShortLivedTokenEnvelope {
  data?: IInstagramShortLivedTokenPayload[];
  access_token?: string;
  user_id?: number | string;
  permissions?: string | string[];
  error_message?: string;
  error_type?: string;
}

interface IInstagramLongLivedTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
}

interface IInstagramGraphErrorResponse {
  error?: {
    message?: string;
    code?: number;
    fbtrace_id?: string;
  };
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
      scopes:
        shortLivedToken.permissions ?? this.env.instagramOAuthScopes.split(","),
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

    const data = (await response.json()) as IInstagramLongLivedTokenResponse &
      IInstagramGraphErrorResponse;

    if (!response.ok) {
      throw this.buildGraphApiError(
        data,
        "Falha ao renovar token do Instagram",
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
    const formData = new FormData();
    formData.append("client_id", this.env.instagramAppId);
    formData.append("client_secret", this.env.instagramAppSecret);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", this.env.instagramRedirectUri);
    formData.append("code", code);

    const response = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as IInstagramShortLivedTokenEnvelope;

    if (!response.ok) {
      throw new AppError(
        data.error_message ?? "Falha ao trocar código OAuth do Instagram",
        502,
        "instagram_oauth_exchange_failed",
      );
    }

    return this.normalizeShortLivedTokenResponse(data);
  }

  private normalizeShortLivedTokenResponse(
    data: IInstagramShortLivedTokenEnvelope,
  ): IInstagramShortLivedTokenResponse {
    const wrapped = data.data?.[0];

    if (wrapped?.access_token) {
      return {
        access_token: wrapped.access_token,
        user_id: wrapped.user_id,
        permissions: this.parsePermissions(wrapped.permissions),
      };
    }

    if (data.access_token && data.user_id !== undefined) {
      return {
        access_token: data.access_token,
        user_id: data.user_id,
        permissions: this.parsePermissions(data.permissions),
      };
    }

    throw new AppError(
      "Resposta inválida ao obter token curto do Instagram",
      502,
      "instagram_oauth_invalid_response",
    );
  }

  private parsePermissions(
    permissions?: string | string[],
  ): string[] | undefined {
    if (!permissions) {
      return undefined;
    }

    if (Array.isArray(permissions)) {
      return permissions;
    }

    return permissions
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);
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

    const data = (await response.json()) as IInstagramLongLivedTokenResponse &
      IInstagramGraphErrorResponse;

    if (!response.ok) {
      throw this.buildGraphApiError(
        data,
        "Falha ao obter token de longa duração",
        "instagram_long_lived_token_failed",
      );
    }

    return data;
  }

  private buildGraphApiError(
    data: IInstagramGraphErrorResponse,
    fallbackMessage: string,
    code: string,
  ): AppError {
    const message = data.error?.message ?? fallbackMessage;
    const fbtraceId = data.error?.fbtrace_id;

    return new AppError(
      fbtraceId ? `${message} (fbtrace_id: ${fbtraceId})` : message,
      502,
      code,
    );
  }
}
