export interface IBillingMetricsDateRange {
  from: Date;
  to: Date;
}

export interface IBillingPaidRechargeRecord {
  amount: number;
  paidAt: Date;
}

export interface IBillingAdminCreditRecord {
  amount: number;
  createdAt: Date;
}

export interface IBillingRechargeActivityRecord {
  amount: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
}

export interface IBillingMetricsRawData {
  paidRecharges: IBillingPaidRechargeRecord[];
  adminCredits: IBillingAdminCreditRecord[];
  rechargeActivity: IBillingRechargeActivityRecord[];
  pendingRechargesInPeriod: number;
}

export interface IWalletBillingRepository {
  getBillingRawData(range: IBillingMetricsDateRange): Promise<IBillingMetricsRawData>;
}
