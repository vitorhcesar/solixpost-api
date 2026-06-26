import { AppError } from "@/http/services/app/errors/app.error";
import { Publication } from "@/domain/entities/publication.entity";
import {
  PublicationDestinationScopeEnum,
  PublicationTypeEnum,
} from "@/domain/enums/instagram.enum";
import type { IInstagramConnectedAccountRepository } from "@/domain/repositories/instagram-connected-account.repository";
import type { IPublicationRepository } from "@/domain/repositories/publication.repository";
import type { IInstagramContentPublishingService } from "@/domain/instagram/instagram-content-publishing.service";
import type { IInstagramOAuthService } from "@/domain/instagram/instagram.service";
import type { IPublicationDto } from "@/app/usecases/publication/dto/publication.dto";
import { mapPublicationToDto } from "@/app/usecases/publication/map-publication-to-dto.util";

export interface ICreatePublicationInput {
  type: PublicationTypeEnum;
  destinationScope: PublicationDestinationScopeEnum;
  caption?: string | null;
  mediaUrl: string;
  instagramConnectedAccountIds?: string[];
}

export class CreateAndPublishPublicationUseCase {
  constructor(
    private readonly publicationRepository: IPublicationRepository,
    private readonly instagramConnectedAccountRepository: IInstagramConnectedAccountRepository,
    private readonly instagramContentPublishingService: IInstagramContentPublishingService,
    private readonly instagramOAuthService: IInstagramOAuthService,
  ) {}

  async execute(
    authUserId: string,
    input: ICreatePublicationInput,
  ): Promise<IPublicationDto> {
    const destinationAccountIds = await this.resolveDestinationAccountIds(
      authUserId,
      input,
    );

    if (destinationAccountIds.length === 0) {
      throw new AppError(
        "Nenhuma conta Instagram conectada disponível para publicação",
        400,
        "no_instagram_accounts_available",
      );
    }

    const publication = Publication.create({
      userId: authUserId,
      type: input.type,
      destinationScope: input.destinationScope,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
      instagramConnectedAccountIds: destinationAccountIds,
    });

    publication.markAsProcessing();
    const savedPublication = await this.publicationRepository.save(publication);

    for (const target of savedPublication.targets) {
      const account = await this.instagramConnectedAccountRepository.findByIdAndUserId(
        target.instagramConnectedAccountId,
        authUserId,
      );

      if (!account || !account.isConnected()) {
        target.markAsFailed("Conta Instagram indisponível");
        continue;
      }

      target.markAsProcessing();

      try {
        let accessToken = account.accessToken;

        if (account.isTokenExpired()) {
          const refreshed = await this.instagramOAuthService.refreshLongLivedToken(
            accessToken,
          );
          accessToken = refreshed.accessToken;
          account.updateOAuthData({
            accessToken,
            tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
            scopes: refreshed.scopes.length ? refreshed.scopes : account.scopes,
            username: account.username,
            displayName: account.displayName,
            profilePictureUrl: account.profilePictureUrl,
          });
          await this.instagramConnectedAccountRepository.save(account);
        }

        const publishInput = {
          instagramUserId: account.instagramUserId,
          accessToken,
          mediaUrl: input.mediaUrl,
          caption: input.caption,
        };

        const result =
          input.type === PublicationTypeEnum.STORY
            ? await this.instagramContentPublishingService.publishStory(publishInput)
            : await this.instagramContentPublishingService.publishPost(publishInput);

        target.markAsSuccess(result.instagramMediaId);
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

    savedPublication.replaceTargets(savedPublication.targets);
    savedPublication.finalizeStatus();

    const finalPublication = await this.publicationRepository.save(savedPublication);

    return mapPublicationToDto(finalPublication);
  }

  private async resolveDestinationAccountIds(
    authUserId: string,
    input: ICreatePublicationInput,
  ): Promise<string[]> {
    const connectedAccounts =
      await this.instagramConnectedAccountRepository.findByUserId(authUserId);

    const activeAccounts = connectedAccounts.filter((account) =>
      account.isConnected(),
    );

    if (input.destinationScope === PublicationDestinationScopeEnum.ALL) {
      return activeAccounts.map((account) => account.id);
    }

    const selectedIds = input.instagramConnectedAccountIds ?? [];

    if (selectedIds.length === 0) {
      throw new AppError(
        "Selecione ao menos uma conta Instagram",
        400,
        "instagram_accounts_required",
      );
    }

    const activeAccountIds = new Set(activeAccounts.map((account) => account.id));
    const invalidIds = selectedIds.filter((id) => !activeAccountIds.has(id));

    if (invalidIds.length > 0) {
      throw new AppError(
        "Uma ou mais contas selecionadas são inválidas",
        400,
        "invalid_instagram_accounts",
        { invalidIds },
      );
    }

    return selectedIds;
  }
}

export class GetPublicationUseCase {
  constructor(private readonly publicationRepository: IPublicationRepository) {}

  async execute(authUserId: string, publicationId: string): Promise<IPublicationDto> {
    const publication = await this.publicationRepository.findByIdAndUserId(
      publicationId,
      authUserId,
    );

    if (!publication) {
      throw new AppError("Publicação não encontrada", 404, "publication_not_found");
    }

    return mapPublicationToDto(publication);
  }
}
