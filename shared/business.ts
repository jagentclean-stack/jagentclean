export const BOOKING_STATUSES = ["pending", "quoted", "in_progress", "completed", "cancelled"] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "待聯絡",
  quoted: "已報價",
  in_progress: "施工中",
  completed: "完成",
  cancelled: "取消",
};

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (BOOKING_STATUSES as readonly string[]).includes(value);
}
