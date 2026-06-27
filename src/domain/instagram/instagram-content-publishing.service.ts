export interface IPublishMediaInput {
  instagramUserId: string;
  accessToken: string;
  mediaUrl: string;
  caption?: string | null;
}

export interface IPublishMediaResult {
  instagramMediaId: string;
  instagramPermalink: string | null;
}

export interface IInstagramContentPublishingService {
  publishPost(input: IPublishMediaInput): Promise<IPublishMediaResult>;
  publishStory(input: IPublishMediaInput): Promise<IPublishMediaResult>;
}
