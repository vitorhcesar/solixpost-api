export interface IPublicationTargetDto {
  id: string;
  instagramConnectedAccountId: string;
  status: string;
  instagramMediaId: string | null;
  instagramPermalink: string | null;
  errorMessage: string | null;
}

export interface IPublicationDto {
  id: string;
  type: string;
  destinationScope: string;
  caption: string | null;
  mediaUrl: string;
  status: string;
  targets: IPublicationTargetDto[];
  createdAt: string;
  updatedAt: string;
}
