import { randomBytes } from "node:crypto";
import { AppError } from "@/http/services/app/errors/app.error";
import { InstagramConnectedAccount } from "@/domain/entities/instagram-connected-account.entity";
import type {
  IInstagramConnectedAccountRepository,
  IInstagramOAuthStateRepository,
} from "@/domain/repositories/instagram-connected-account.repository";
import type {
  IInstagramGraphService,
  IInstagramOAuthService,
} from "@/domain/instagram/instagram.service";
import type {
  IInstagramConnectedAccountDto,
  IInstagramConnectSessionDto,
} from "@/app/usecases/instagram/dto/instagram.dto";
import { mapInstagramConnectedAccountToDto } from "@/app/usecases/instagram/map-instagram-connected-account-to-dto.util";

export class CreateInstagramConnectSessionUseCase {
  constructor(
    private readonly oauthStateRepository: IInstagramOAuthStateRepository,
    private readonly instagramOAuthService: IInstagramOAuthService,
  ) {}

  async execute(authUserId: string): Promise<IInstagramConnectSessionDto> {
    const state = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.oauthStateRepository.create(authUserId, state, expiresAt);

    return {
      authorizationUrl: this.instagramOAuthService.buildAuthorizationUrl(state),
      state,
      expiresAt: expiresAt.toISOString(),
    };
  }
}

export class CompleteInstagramConnectUseCase {
  constructor(
    private readonly oauthStateRepository: IInstagramOAuthStateRepository,
    private readonly instagramConnectedAccountRepository: IInstagramConnectedAccountRepository,
    private readonly instagramOAuthService: IInstagramOAuthService,
    private readonly instagramGraphService: IInstagramGraphService,
  ) {}

  async execute(input: {
    code: string;
    state: string;
  }): Promise<IInstagramConnectedAccountDto> {
    const oauthState = await this.oauthStateRepository.findValidState(input.state);

    if (!oauthState) {
      throw new AppError("State OAuth inválido ou expirado", 400, "invalid_oauth_state");
    }

    const tokens = await this.instagramOAuthService.exchangeAuthorizationCode(
      input.code,
    );
    const profile = await this.instagramGraphService.getProfile(tokens.accessToken);
    const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    const existingAccount =
      await this.instagramConnectedAccountRepository.findByUserIdAndInstagramUserId(
        oauthState.userId,
        profile.instagramUserId,
      );

    let account = existingAccount;

    if (account) {
      account.updateOAuthData({
        accessToken: tokens.accessToken,
        tokenExpiresAt,
        scopes: tokens.scopes,
        username: profile.username,
        displayName: profile.displayName,
        profilePictureUrl: profile.profilePictureUrl,
      });
    } else {
      account = InstagramConnectedAccount.create({
        userId: oauthState.userId,
        instagramUserId: profile.instagramUserId,
        username: profile.username,
        displayName: profile.displayName,
        profilePictureUrl: profile.profilePictureUrl,
        accessToken: tokens.accessToken,
        tokenExpiresAt,
        scopes: tokens.scopes,
      });
    }

    const savedAccount =
      await this.instagramConnectedAccountRepository.save(account);

    await this.oauthStateRepository.deleteByState(input.state);

    return mapInstagramConnectedAccountToDto(savedAccount);
  }
}

export class ListInstagramConnectedAccountsUseCase {
  constructor(
    private readonly instagramConnectedAccountRepository: IInstagramConnectedAccountRepository,
  ) {}

  async execute(authUserId: string): Promise<IInstagramConnectedAccountDto[]> {
    const accounts =
      await this.instagramConnectedAccountRepository.findByUserId(authUserId);

    return accounts.map(mapInstagramConnectedAccountToDto);
  }
}

export class DisconnectInstagramAccountUseCase {
  constructor(
    private readonly instagramConnectedAccountRepository: IInstagramConnectedAccountRepository,
  ) {}

  async execute(authUserId: string, accountId: string): Promise<void> {
    const account =
      await this.instagramConnectedAccountRepository.findByIdAndUserId(
        accountId,
        authUserId,
      );

    if (!account) {
      throw new AppError("Conta Instagram não encontrada", 404, "instagram_account_not_found");
    }

    account.markAsDisconnected();
    await this.instagramConnectedAccountRepository.save(account);
  }
}
