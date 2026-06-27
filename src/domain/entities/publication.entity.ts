import {
  PublicationDestinationScopeEnum,
  PublicationStatusEnum,
  PublicationTargetStatusEnum,
  PublicationTypeEnum,
} from "@/domain/enums/instagram.enum";

export interface IPublicationTargetProps {
  id: string;
  publicationId: string;
  instagramConnectedAccountId: string;
  status: PublicationTargetStatusEnum;
  instagramMediaId: string | null;
  instagramPermalink: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPublicationProps {
  id: string;
  userId: string;
  type: PublicationTypeEnum;
  destinationScope: PublicationDestinationScopeEnum;
  caption: string | null;
  mediaUrl: string;
  objectKey: string | null;
  status: PublicationStatusEnum;
  createdAt: Date;
  updatedAt: Date;
  targets: IPublicationTargetProps[];
}

export interface IPublicationCreateProps {
  userId: string;
  type: PublicationTypeEnum;
  destinationScope: PublicationDestinationScopeEnum;
  caption?: string | null;
  mediaUrl: string;
  objectKey: string | null;
  instagramConnectedAccountIds: string[];
}

export class PublicationTarget {
  private readonly props: IPublicationTargetProps;

  private constructor(props: IPublicationTargetProps) {
    this.props = props;
  }

  static create(props: {
    publicationId: string;
    instagramConnectedAccountId: string;
  }): PublicationTarget {
    const now = new Date();

    return new PublicationTarget({
      id: "",
      publicationId: props.publicationId,
      instagramConnectedAccountId: props.instagramConnectedAccountId,
      status: PublicationTargetStatusEnum.PENDING,
      instagramMediaId: null,
      instagramPermalink: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: IPublicationTargetProps): PublicationTarget {
    return new PublicationTarget(props);
  }

  get id(): string {
    return this.props.id;
  }

  get publicationId(): string {
    return this.props.publicationId;
  }

  get instagramConnectedAccountId(): string {
    return this.props.instagramConnectedAccountId;
  }

  get status(): PublicationTargetStatusEnum {
    return this.props.status;
  }

  get instagramMediaId(): string | null {
    return this.props.instagramMediaId;
  }

  get instagramPermalink(): string | null {
    return this.props.instagramPermalink;
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  markAsProcessing(): void {
    this.props.status = PublicationTargetStatusEnum.PROCESSING;
    this.props.updatedAt = new Date();
  }

  markAsSuccess(instagramMediaId: string, instagramPermalink: string | null): void {
    this.props.status = PublicationTargetStatusEnum.SUCCESS;
    this.props.instagramMediaId = instagramMediaId;
    this.props.instagramPermalink = instagramPermalink;
    this.props.errorMessage = null;
    this.props.updatedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.props.status = PublicationTargetStatusEnum.FAILED;
    this.props.errorMessage = errorMessage;
    this.props.updatedAt = new Date();
  }

  toObject(): IPublicationTargetProps {
    return { ...this.props };
  }
}

export class Publication {
  private readonly props: IPublicationProps;

  private constructor(props: IPublicationProps) {
    this.props = props;
  }

  static create(props: IPublicationCreateProps): Publication {
    const now = new Date();
    const publicationId = "";

    const targets = props.instagramConnectedAccountIds.map((accountId) =>
      PublicationTarget.create({
        publicationId,
        instagramConnectedAccountId: accountId,
      }),
    );

    return new Publication({
      id: publicationId,
      userId: props.userId,
      type: props.type,
      destinationScope: props.destinationScope,
      caption: props.caption ?? null,
      mediaUrl: props.mediaUrl,
      objectKey: props.objectKey,
      status: PublicationStatusEnum.PENDING,
      createdAt: now,
      updatedAt: now,
      targets: targets.map((target) => target.toObject()),
    });
  }

  static restore(props: IPublicationProps): Publication {
    return new Publication(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): PublicationTypeEnum {
    return this.props.type;
  }

  get destinationScope(): PublicationDestinationScopeEnum {
    return this.props.destinationScope;
  }

  get caption(): string | null {
    return this.props.caption;
  }

  get mediaUrl(): string {
    return this.props.mediaUrl;
  }

  get objectKey(): string | null {
    return this.props.objectKey;
  }

  get status(): PublicationStatusEnum {
    return this.props.status;
  }

  get targets(): PublicationTarget[] {
    return this.props.targets.map((target) => PublicationTarget.restore(target));
  }

  belongsToUser(userId: string): boolean {
    return this.props.userId === userId;
  }

  markAsProcessing(): void {
    this.props.status = PublicationStatusEnum.PROCESSING;
    this.props.updatedAt = new Date();
  }

  finalizeStatus(): void {
    const targets = this.targets;
    const successCount = targets.filter(
      (target) => target.status === PublicationTargetStatusEnum.SUCCESS,
    ).length;
    const failedCount = targets.filter(
      (target) => target.status === PublicationTargetStatusEnum.FAILED,
    ).length;

    if (successCount === targets.length) {
      this.props.status = PublicationStatusEnum.COMPLETED;
    } else if (successCount > 0 && failedCount > 0) {
      this.props.status = PublicationStatusEnum.PARTIAL_FAILURE;
    } else {
      this.props.status = PublicationStatusEnum.FAILED;
    }

    this.props.updatedAt = new Date();
  }

  clearObjectKey(): void {
    this.props.objectKey = null;
    this.props.updatedAt = new Date();
  }

  replaceTargets(targets: PublicationTarget[]): void {
    this.props.targets = targets.map((target) => target.toObject());
    this.props.updatedAt = new Date();
  }

  setId(id: string): void {
    this.props.id = id;

    this.props.targets = this.props.targets.map((target) => ({
      ...target,
      publicationId: id,
    }));
  }

  toObject(): IPublicationProps {
    return {
      ...this.props,
      targets: this.props.targets.map((target) => ({ ...target })),
    };
  }
}
