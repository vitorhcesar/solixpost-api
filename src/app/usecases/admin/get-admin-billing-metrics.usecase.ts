import type { IWalletBillingRepository } from "@/domain/repositories/wallet-billing.repository";
import type { IAdminBillingMetricsDto } from "@/app/usecases/admin/dto/admin-billing-metrics.dto";
import {
  formatDateOnly,
  listDaysBetween,
  parseDateOnlyEnd,
  parseDateOnlyStart,
} from "@/app/usecases/admin/utils/date-range.util";

export interface IGetAdminBillingMetricsInput {
  from: string;
  to: string;
}

export class GetAdminBillingMetricsUseCase {
  constructor(
    private readonly walletBillingRepository: IWalletBillingRepository,
  ) {}

  async execute(
    input: IGetAdminBillingMetricsInput,
  ): Promise<IAdminBillingMetricsDto> {
    const fromDate = parseDateOnlyStart(input.from);
    const toDate = parseDateOnlyEnd(input.to);

    const raw = await this.walletBillingRepository.getBillingRawData({
      from: fromDate,
      to: toDate,
    });

    const dailyMap = new Map<
      string,
      {
        pixRevenue: number;
        adminCredits: number;
        rechargesCreated: number;
        rechargesPaid: number;
      }
    >();

    for (const day of listDaysBetween(fromDate, toDate)) {
      dailyMap.set(day, {
        pixRevenue: 0,
        adminCredits: 0,
        rechargesCreated: 0,
        rechargesPaid: 0,
      });
    }

    let totalPixRevenue = 0;
    let totalAdminCredits = 0;
    let rechargesCreated = 0;
    let rechargesPaid = 0;

    for (const recharge of raw.paidRecharges) {
      const day = formatDateOnly(recharge.paidAt);
      const bucket = dailyMap.get(day);

      totalPixRevenue += recharge.amount;
      rechargesPaid += 1;

      if (bucket) {
        bucket.pixRevenue += recharge.amount;
        bucket.rechargesPaid += 1;
      }
    }

    for (const credit of raw.adminCredits) {
      const day = formatDateOnly(credit.createdAt);
      const bucket = dailyMap.get(day);

      totalAdminCredits += credit.amount;

      if (bucket) {
        bucket.adminCredits += credit.amount;
      }
    }

    for (const activity of raw.rechargeActivity) {
      const day = formatDateOnly(activity.createdAt);
      const bucket = dailyMap.get(day);

      rechargesCreated += 1;

      if (bucket) {
        bucket.rechargesCreated += 1;
      }
    }

    const dailyBreakdown = listDaysBetween(fromDate, toDate).map((date) => {
      const bucket = dailyMap.get(date)!;

      return {
        date,
        pixRevenue: Number(bucket.pixRevenue.toFixed(2)),
        adminCredits: Number(bucket.adminCredits.toFixed(2)),
        totalRevenue: Number(
          (bucket.pixRevenue + bucket.adminCredits).toFixed(2),
        ),
        rechargesCreated: bucket.rechargesCreated,
        rechargesPaid: bucket.rechargesPaid,
      };
    });

    return {
      from: input.from,
      to: input.to,
      totalPixRevenue: Number(totalPixRevenue.toFixed(2)),
      totalAdminCredits: Number(totalAdminCredits.toFixed(2)),
      totalRevenue: Number((totalPixRevenue + totalAdminCredits).toFixed(2)),
      rechargesCreated,
      rechargesPaid,
      pendingRecharges: raw.pendingRechargesInPeriod,
      dailyBreakdown,
    };
  }
}
