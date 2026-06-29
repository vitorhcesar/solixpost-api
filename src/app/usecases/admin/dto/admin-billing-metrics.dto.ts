export interface IAdminBillingDailyMetricDto {
  date: string;
  pixRevenue: number;
  adminCredits: number;
  totalRevenue: number;
  rechargesCreated: number;
  rechargesPaid: number;
}

export interface IAdminBillingMetricsDto {
  from: string;
  to: string;
  totalPixRevenue: number;
  totalAdminCredits: number;
  totalRevenue: number;
  rechargesCreated: number;
  rechargesPaid: number;
  pendingRecharges: number;
  dailyBreakdown: IAdminBillingDailyMetricDto[];
}
