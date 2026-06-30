export type InstagramAccountIssueType =
  | "token_expired"
  | "account_expired"
  | "disconnected";

export interface IAccountSlotAccountDto {
  id: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  status: string;
  tokenExpiresAt: string;
  isTokenExpired: boolean;
  hasConnectionIssue: boolean;
  issueType: InstagramAccountIssueType | null;
}

export interface IAccountSlotDto {
  id: string;
  status: string;
  expiresAt: string;
  isExpired: boolean;
  instagramAccount: IAccountSlotAccountDto | null;
  createdAt: string;
}

export interface IAccountSlotPricingDto {
  unitPrice: number;
  comboDiscountRate: number;
  combos: Array<{
    quantity: number;
    unitPrice: number;
    total: number;
    savings: number;
  }>;
}

export interface IPurchaseAccountSlotsResultDto {
  slots: IAccountSlotDto[];
  totalCharged: number;
  newBalance: number;
}

export interface IRenewAccountSlotResultDto {
  slot: IAccountSlotDto;
  totalCharged: number;
  newBalance: number;
}
