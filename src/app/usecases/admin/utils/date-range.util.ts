export function parseDateOnlyStart(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function parseDateOnlyEnd(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCurrentMonthDateRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: formatDateOnly(from),
    to: formatDateOnly(to),
  };
}

export function listDaysBetween(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  while (cursor <= end) {
    days.push(formatDateOnly(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
