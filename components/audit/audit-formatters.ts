const countFormatter = new Intl.NumberFormat("id-ID");
const decimalFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const currencyFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
});
const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function formatCarbon(value: number): string {
  return `${formatDecimal(value)} t CO₂e`;
}

export function formatHectares(value: number): string {
  return `${formatDecimal(value)} ha`;
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waktu tidak tersedia"
    : dateTimeFormatter.format(date);
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "Semua tanggal";
  }

  const date = new Date(`${value}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}
