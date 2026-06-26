export interface IInstagramConnectedAccountDto {
  id: string;
  instagramUserId: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  scopes: string[];
  status: string;
  tokenExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInstagramConnectSessionDto {
  authorizationUrl: string;
  state: string;
  expiresAt: string;
}
