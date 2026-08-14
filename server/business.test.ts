import { describe, expect, it } from "vitest";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS, isBookingStatus } from "../shared/business";

describe("預約狀態契約", () => {
  it("只接受既定的服務流程狀態", () => {
    expect(isBookingStatus("pending")).toBe(true);
    expect(isBookingStatus("completed")).toBe(true);
    expect(isBookingStatus("archived")).toBe(false);
    expect(isBookingStatus(undefined)).toBe(false);
  });

  it("為每個可接受狀態提供後台顯示標籤", () => {
    expect(BOOKING_STATUSES.map((status) => BOOKING_STATUS_LABELS[status])).toEqual([
      "待聯絡",
      "已報價",
      "施工中",
      "完成",
      "取消",
    ]);
  });
});
