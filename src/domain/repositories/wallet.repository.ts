import type { WalletRechargeStatusEnum, WalletTransactionTypeEnum } from "@/domain/enums/wallet.enum";

export interface IWallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionTypeEnum;
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceKey: string | null;
  createdAt: Date;
}

export interface IWalletRecharge {
  id: string;
  walletId: string;
  identifier: string;
  amount: number;
  status: WalletRechargeStatusEnum;
  omegapayTransactionId: string | null;
  pixCode: string | null;
  pixImageUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreditWalletInput {
  walletId: string;
  amount: number;
  type: WalletTransactionTypeEnum;
  description?: string;
  referenceKey?: string;
  metadata?: Record<string, unknown>;
}

export interface IWalletRepository {
  getOrCreateByUserId(userId: string): Promise<IWallet>;
  findByUserId(userId: string): Promise<IWallet | null>;
  creditWallet(input: ICreditWalletInput): Promise<IWallet>;
  createRecharge(input: {
    walletId: string;
    identifier: string;
    amount: number;
  }): Promise<IWalletRecharge>;
  updateRechargeAfterPixCreation(input: {
    rechargeId: string;
    omegapayTransactionId: string;
    pixCode: string;
    pixImageUrl?: string;
  }): Promise<IWalletRecharge>;
  findRechargeById(id: string): Promise<IWalletRecharge | null>;
  findRechargeByIdentifier(identifier: string): Promise<IWalletRecharge | null>;
  findRechargeByOmegaPayTransactionId(
    transactionId: string,
  ): Promise<IWalletRecharge | null>;
  markRechargePaid(rechargeId: string): Promise<IWalletRecharge>;
  markRechargeCanceled(rechargeId: string): Promise<IWalletRecharge>;
  hasTransactionWithReferenceKey(referenceKey: string): Promise<boolean>;
}
