import { formatInTimeZone } from "date-fns-tz";
import { slotStartUtc } from "@/lib/dates";

export type OrderSlot = {
  slotStartIso: string;
  slotLocalTime: string;
};

export function buildOrderSlots(
  date: string,
  startTime: string,
  orderLength: number,
  minutesPerTurn: number,
  timezone: string,
): OrderSlot[] {
  return Array.from({ length: orderLength }, (_, index) => {
    const slot = slotStartUtc(
      date,
      startTime,
      index,
      minutesPerTurn,
      timezone,
    );
    return {
      slotStartIso: slot.toISOString(),
      slotLocalTime: formatInTimeZone(slot, timezone, "h:mm a"),
    };
  });
}
