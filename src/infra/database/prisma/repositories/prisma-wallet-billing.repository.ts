import { Prisma } from "../../../../../generated/prisma";
import type {
  IBillingMetricsDateRange,
  IBillingMetricsRawData,
  IWalletBillingRepository,
} from "@/domain/repositories/wallet-billing.repository";
import {
  WalletRechargeStatusEnum,
  WalletTransactionTypeEnum,
} from "@/domain/enums/wallet.enum";
import { BasePrismaRepository } from "@/infra/database/prisma/repositories/base-prisma.repository";

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}

export class PrismaWalletBillingRepository
  extends BasePrismaRepository
  implements IWalletBillingRepository
{
  async getBillingRawData(
    range: IBillingMetricsDateRange,
  ): Promise<IBillingMetricsRawData> {
    const [paidRecharges, adminCredits, rechargeActivity, pendingRechargesInPeriod] =
      await Promise.all([
        this.getPrismaClient().walletRecharge.findMany({
          where: {
            status: WalletRechargeStatusEnum.PAID,
            paidAt: {
              gte: range.from,
              lte: range.to,
            },
          },
          select: {
            amount: true,
            paidAt: true,
          },
        }),
        this.getPrismaClient().walletTransaction.findMany({
          where: {
            type: WalletTransactionTypeEnum.CREDIT_ADMIN,
            createdAt: {
              gte: range.from,
              lte: range.to,
            },
          },
          select: {
            amount: true,
            createdAt: true,
          },
        }),
        this.getPrismaClient().walletRecharge.findMany({
          where: {
            createdAt: {
              gte: range.from,
              lte: range.to,
            },
          },
          select: {
            amount: true,
            status: true,
            createdAt: true,
            paidAt: true,
          },
        }),
        this.getPrismaClient().walletRecharge.count({
          where: {
            status: WalletRechargeStatusEnum.PENDING,
            createdAt: {
              gte: range.from,
              lte: range.to,
            },
          },
        }),
      ]);

    return {
      paidRecharges: paidRecharges
        .filter((row) => row.paidAt !== null)
        .map((row) => ({
          amount: decimalToNumber(row.amount),
          paidAt: row.paidAt!,
        })),
      adminCredits: adminCredits.map((row) => ({
        amount: decimalToNumber(row.amount),
        createdAt: row.createdAt,
      })),
      rechargeActivity: rechargeActivity.map((row) => ({
        amount: decimalToNumber(row.amount),
        status: row.status,
        createdAt: row.createdAt,
        paidAt: row.paidAt,
      })),
      pendingRechargesInPeriod,
    };
  }
}
