import type { Publication } from "@/domain/entities/publication.entity";
import type { IPublicationDto } from "@/app/usecases/publication/dto/publication.dto";

export function mapPublicationToDto(publication: Publication): IPublicationDto {
  const data = publication.toObject();

  return {
    id: data.id,
    type: data.type,
    destinationScope: data.destinationScope,
    caption: data.caption,
    mediaUrl: data.mediaUrl,
    status: data.status,
    targets: data.targets.map((target) => ({
      id: target.id,
      instagramConnectedAccountId: target.instagramConnectedAccountId,
      status: target.status,
      instagramMediaId: target.instagramMediaId,
      instagramPermalink: target.instagramPermalink,
      errorMessage: target.errorMessage,
    })),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}
