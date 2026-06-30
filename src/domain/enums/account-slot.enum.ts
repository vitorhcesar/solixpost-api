export enum AccountSlotStatusEnum {
  ACTIVE = "active",
  EXPIRED = "expired",
}

export const SLOT_PRICE_BRL = 1;
export const SLOT_DURATION_DAYS = 30;

export const SLOT_COMBO_CONFIG = [
  { quantity: 10, discountRate: 0.1 },
  { quantity: 25, discountRate: 0.15 },
  { quantity: 50, discountRate: 0.2 },
  { quantity: 100, discountRate: 0.25 },
] as const;

export type SlotComboQuantity = (typeof SLOT_COMBO_CONFIG)[number]["quantity"];

export const SLOT_COMBO_QUANTITIES: readonly SlotComboQuantity[] =
  SLOT_COMBO_CONFIG.map((combo) => combo.quantity);

export function isSlotComboQuantity(value: number): value is SlotComboQuantity {
  return SLOT_COMBO_QUANTITIES.includes(value as SlotComboQuantity);
}

export function getSlotComboDiscountRate(quantity: SlotComboQuantity): number {
  const combo = SLOT_COMBO_CONFIG.find((item) => item.quantity === quantity);

  if (!combo) {
    throw new Error("Invalid combo quantity");
  }

  return combo.discountRate;
}
