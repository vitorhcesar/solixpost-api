import { AppError } from "@/http/services/app/errors/app.error";
import { Publication } from "@/domain/entities/publication.entity";
import {
  PublicationDestinationScopeEnum,
  PublicationTypeEnum,
} from "@/domain/enums/instagram.enum";
import type { IInstagramConnectedAccountRepository } from "@/domain/repositories/instagram-connected-account.repository";
import type { IPublicationRepository } from "@/domain/repositories/publication.repository";
import type { IPublicationDto } from "@/app/usecases/publication/dto/publication.dto";
import { mapPublicationToDto } from "@/app/usecases/publication/map-publication-to-dto.util";
import type { PublicationQueue } from "@/infra/queue/publication-queue";
import type { EnvService } from "@/http/services/env/env.service";

export interface ICreatePublicationInput {
  type: PublicationTypeEnum;
  destinationScope: PublicationDestinationScopeEnum;
  caption?: string | null;
  objectKey: string;
  instagramConnectedAccountIds?: string[];
}

export class CreateAndPublishPublicationUseCase {
  constructor(
    private readonly publicationRepository: IPublicationRepository,
    private readonly instagramConnectedAccountRepository: IInstagramConnectedAccountRepository,
    private readonly publicationQueue: PublicationQueue,
    private readonly env: EnvService,
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

    const mediaUrl = `${this.env.publicApiUrl}/public/objects/${input.objectKey}`;

    const publication = Publication.create({
      userId: authUserId,
      type: input.type,
      destinationScope: input.destinationScope,
      caption: input.caption,
      mediaUrl,
      objectKey: input.objectKey,
      instagramConnectedAccountIds: destinationAccountIds,
    });

    const savedPublication = await this.publicationRepository.save(publication);

    await this.publicationQueue.enqueue(savedPublication.id);

    return mapPublicationToDto(savedPublication);
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

export class ListPublicationsUseCase {
  constructor(private readonly publicationRepository: IPublicationRepository) {}

  async execute(authUserId: string): Promise<IPublicationDto[]> {
    const publications = await this.publicationRepository.findAllByUserId(authUserId);
    return publications.map(mapPublicationToDto);
  }
}
