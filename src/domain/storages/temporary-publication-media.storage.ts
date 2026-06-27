export interface IUploadTemporaryMediaInput {
  objectKey: string;
  buffer: Buffer;
  contentType: string;
  size: number;
}

export interface ITemporaryPublicationMediaStorage {
  upload(input: IUploadTemporaryMediaInput): Promise<void>;
  getStream(objectKey: string): Promise<{
    stream: NodeJS.ReadableStream;
    contentType: string;
    size: number;
  }>;
  delete(objectKey: string): Promise<void>;
  buildObjectKey(userId: string, originalFilename: string): string;
}
