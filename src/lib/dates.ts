import { addMinutes, format, parse } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function todayInTimezone(timezone: string): string {
  return format(toZonedTime(new Date(), timezone), "yyyy-MM-dd");
}

export function yesterdayDate(date: string): string {
  const d = parse(date, "yyyy-MM-dd", new Date());
  d.setDate(d.getDate() - 1);
  return format(d, "yyyy-MM-dd");
}

export function isSchoolDay(date: string, timezone: string): boolean {
  const d = fromZonedTime(
    parse(`${date} 12:00`, "yyyy-MM-dd HH:mm", new Date()),
    timezone,
  );
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

export function slotStartUtc(
  date: string,
  startTime: string,
  turnIndex: number,
  minutesPerTurn: number,
  timezone: string,
): Date {
  const [hours, minutes] = startTime.split(":").map(Number);
  const local = parse(
    `${date} ${hours}:${minutes}`,
    "yyyy-MM-dd H:m",
    new Date(),
  );
  const withTurn = addMinutes(local, turnIndex * minutesPerTurn);
  return fromZonedTime(withTurn, timezone);
}

export function minutesUntil(target: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60_000));
}
