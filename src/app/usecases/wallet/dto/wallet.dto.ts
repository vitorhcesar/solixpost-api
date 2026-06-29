export interface IWalletDto {
  balance: number;
}

export interface IWalletRechargeDto {
  id: string;
  amount: number;
  status: string;
  identifier: string;
  omegapayTransactionId: string | null;
  pixCode: string | null;
  pixImageUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}
