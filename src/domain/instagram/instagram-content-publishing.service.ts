export interface IPublishMediaInput {
  instagramUserId: string;
  accessToken: string;
  mediaUrl: string;
  caption?: string | null;
}

export interface IPublishMediaResult {
  instagramMediaId: string;
}

export interface IInstagramContentPublishingService {
  publishPost(input: IPublishMediaInput): Promise<IPublishMediaResult>;
  publishStory(input: IPublishMediaInput): Promise<IPublishMediaResult>;
}
