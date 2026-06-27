import type {
  Publication as PrismaPublication,
  PublicationTarget as PrismaPublicationTarget,
} from "../../../../../generated/prisma";
import {
  Publication,
  PublicationTarget,
} from "@/domain/entities/publication.entity";
import {
  PublicationDestinationScopeEnum,
  PublicationStatusEnum,
  PublicationTargetStatusEnum,
  PublicationTypeEnum,
} from "@/domain/enums/instagram.enum";

type TPrismaPublicationWithTargets = PrismaPublication & {
  targets: PrismaPublicationTarget[];
};

export class PublicationMapper {
  static toDomain(row: TPrismaPublicationWithTargets): Publication {
    return Publication.restore({
      id: row.id,
      userId: row.userId,
      type: PublicationMapper.toPublicationType(row.type),
      destinationScope: PublicationMapper.toDestinationScope(row.destinationScope),
      caption: row.caption,
      mediaUrl: row.mediaUrl,
      objectKey: row.objectKey,
      status: PublicationMapper.toPublicationStatus(row.status),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      targets: row.targets.map((target) => ({
        id: target.id,
        publicationId: target.publicationId,
        instagramConnectedAccountId: target.instagramConnectedAccountId,
        status: PublicationMapper.toTargetStatus(target.status),
        instagramMediaId: target.instagramMediaId,
        instagramPermalink: target.instagramPermalink,
        errorMessage: target.errorMessage,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      })),
    });
  }

  static toPrismaCreate(publication: Publication) {
    const data = publication.toObject();

    return {
      userId: data.userId,
      type: data.type,
      destinationScope: data.destinationScope,
      caption: data.caption,
      mediaUrl: data.mediaUrl,
      objectKey: data.objectKey,
      status: data.status,
      targets: {
        create: data.targets.map((target) => ({
          instagramConnectedAccountId: target.instagramConnectedAccountId,
          status: target.status,
          instagramMediaId: target.instagramMediaId,
          instagramPermalink: target.instagramPermalink,
          errorMessage: target.errorMessage,
        })),
      },
    };
  }

  static toPrismaUpdate(publication: Publication) {
    const data = publication.toObject();

    return {
      status: data.status,
      objectKey: data.objectKey,
      updatedAt: data.updatedAt,
      targets: {
        upsert: data.targets.map((target) => ({
          where: { id: target.id || "___invalid___" },
          create: {
            instagramConnectedAccountId: target.instagramConnectedAccountId,
            status: target.status,
            instagramMediaId: target.instagramMediaId,
            instagramPermalink: target.instagramPermalink,
            errorMessage: target.errorMessage,
          },
          update: {
            status: target.status,
            instagramMediaId: target.instagramMediaId,
            instagramPermalink: target.instagramPermalink,
            errorMessage: target.errorMessage,
            updatedAt: target.updatedAt,
          },
        })),
      },
    };
  }

  static targetToPrismaUpdate(target: PublicationTarget) {
    const data = target.toObject();

    return {
      status: data.status,
      instagramMediaId: data.instagramMediaId,
      instagramPermalink: data.instagramPermalink,
      errorMessage: data.errorMessage,
      updatedAt: data.updatedAt,
    };
  }

  private static toPublicationType(type: string): PublicationTypeEnum {
    return type === PublicationTypeEnum.STORY
      ? PublicationTypeEnum.STORY
      : PublicationTypeEnum.POST;
  }

  private static toDestinationScope(
    scope: string,
  ): PublicationDestinationScopeEnum {
    return scope === PublicationDestinationScopeEnum.SELECTED
      ? PublicationDestinationScopeEnum.SELECTED
      : PublicationDestinationScopeEnum.ALL;
  }

  private static toPublicationStatus(status: string): PublicationStatusEnum {
    switch (status) {
      case PublicationStatusEnum.PROCESSING:
        return PublicationStatusEnum.PROCESSING;
      case PublicationStatusEnum.COMPLETED:
        return PublicationStatusEnum.COMPLETED;
      case PublicationStatusEnum.PARTIAL_FAILURE:
        return PublicationStatusEnum.PARTIAL_FAILURE;
      case PublicationStatusEnum.FAILED:
        return PublicationStatusEnum.FAILED;
      default:
        return PublicationStatusEnum.PENDING;
    }
  }

  private static toTargetStatus(status: string): PublicationTargetStatusEnum {
    switch (status) {
      case PublicationTargetStatusEnum.PROCESSING:
        return PublicationTargetStatusEnum.PROCESSING;
      case PublicationTargetStatusEnum.SUCCESS:
        return PublicationTargetStatusEnum.SUCCESS;
      case PublicationTargetStatusEnum.FAILED:
        return PublicationTargetStatusEnum.FAILED;
      default:
        return PublicationTargetStatusEnum.PENDING;
    }
  }
}
