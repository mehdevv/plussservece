import type { AvailabilityWindow, Meeting } from "./types";

export const ALGIERS_TZ = "Africa/Algiers";
export const SLOT_MINUTES = 30;
export const DEFAULT_GRID_START = 8 * 60;
export const DEFAULT_GRID_END = 20 * 60;

export const WEEKDAYS = [
  { iso: 1, label: "Monday", short: "Mon" },
  { iso: 2, label: "Tuesday", short: "Tue" },
  { iso: 3, label: "Wednesday", short: "Wed" },
  { iso: 4, label: "Thursday", short: "Thu" },
  { iso: 5, label: "Friday", short: "Fri" },
  { iso: 6, label: "Saturday", short: "Sat" },
  { iso: 7, label: "Sunday", short: "Sun" },
] as const;

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatMinutes(minutes: number) {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(wrapped / 60))}:${pad2(wrapped % 60)}`;
}

export function parseTimeInput(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function todayYmd() {
  return new Date().toLocaleDateString("en-CA", { timeZone: ALGIERS_TZ });
}

export function isoWeekday(ymd: string) {
  const utcDay = new Date(`${ymd}T12:00:00+01:00`).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

export function addDaysYmd(ymd: string, days: number) {
  const ms = Date.parse(`${ymd}T12:00:00+01:00`) + days * 86_400_000;
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: ALGIERS_TZ });
}

export function mondayOfWeek(ymd: string) {
  return addDaysYmd(ymd, 1 - isoWeekday(ymd));
}

export function weekDays(mondayYmd: string) {
  return Array.from({ length: 7 }, (_, index) => addDaysYmd(mondayYmd, index));
}

export function fromAlgiers(ymd: string, minutes: number) {
  const extraDays = Math.floor(minutes / 1440);
  const remaining = minutes - extraDays * 1440;
  const date = extraDays ? addDaysYmd(ymd, extraDays) : ymd;
  return new Date(`${date}T${pad2(Math.floor(remaining / 60))}:${pad2(remaining % 60)}:00+01:00`);
}

export function ymdInAlgiers(value: Date | string) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: ALGIERS_TZ });
}

export function minutesInAlgiers(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ALGIERS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function formatDayHeading(ymd: string) {
  return new Date(`${ymd}T12:00:00+01:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: ALGIERS_TZ,
  });
}

export function formatWeekRange(mondayYmd: string) {
  const sunday = addDaysYmd(mondayYmd, 6);
  const start = new Date(`${mondayYmd}T12:00:00+01:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: ALGIERS_TZ,
  });
  const end = new Date(`${sunday}T12:00:00+01:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: ALGIERS_TZ,
  });
  return `${start} – ${end}`;
}

export function formatWhen(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: ALGIERS_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function gridBounds(windows: AvailabilityWindow[], options?: { editor?: boolean }) {
  if (options?.editor) {
    return { start: 7 * 60, end: 21 * 60 };
  }
  let start = DEFAULT_GRID_START;
  let end = DEFAULT_GRID_END;
  for (const window of windows) {
    start = Math.min(start, window.start_minute);
    end = Math.max(end, window.end_minute);
  }
  return {
    start: Math.floor(start / SLOT_MINUTES) * SLOT_MINUTES,
    end: Math.ceil(end / SLOT_MINUTES) * SLOT_MINUTES,
  };
}

export function slotMinutes(start: number, end: number) {
  const slots: number[] = [];
  for (let minute = start; minute < end; minute += SLOT_MINUTES) slots.push(minute);
  return slots;
}

export function windowCovers(windows: AvailabilityWindow[], ymd: string, startMin: number, endMin: number) {
  const weekday = isoWeekday(ymd);
  return windows.some(
    (window) =>
      window.weekday === weekday && window.start_minute <= startMin && window.end_minute >= endMin,
  );
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function meetingBlocksSlot(meeting: Meeting, ymd: string, startMin: number, endMin: number) {
  return rangesOverlap(
    new Date(meeting.starts_at),
    new Date(meeting.ends_at),
    fromAlgiers(ymd, startMin),
    fromAlgiers(ymd, endMin),
  );
}

export function overlappingMeeting(meetings: Meeting[], start: Date, end: Date, ignoreId?: string) {
  return meetings.find(
    (meeting) =>
      meeting.id !== ignoreId && rangesOverlap(start, end, new Date(meeting.starts_at), new Date(meeting.ends_at)),
  );
}

export function bookingError(
  windows: AvailabilityWindow[],
  meetings: Meeting[],
  start: Date,
  end: Date,
) {
  if (!(start < end)) return "Pick an end time after the start time.";
  if (start.getTime() < Date.now() - 30_000) return "That slot is already in the past.";
  const ymd = ymdInAlgiers(start);
  if (ymd !== ymdInAlgiers(end)) return "Meetings must stay on the same day.";
  if (!windowCovers(windows, ymd, minutesInAlgiers(start), minutesInAlgiers(end))) {
    return "That time is outside the meeting zone.";
  }
  const clash = overlappingMeeting(meetings, start, end);
  if (clash) return `That slot overlaps a ${clash.bdr_id === "bdr1" ? "BDR 1" : "BDR 2"} meeting.`;
  return "";
}

export type WindowDraft = {
  weekday: number;
  start_minute: number;
  end_minute: number;
};

export function toggleWeekSlot(
  windows: WindowDraft[],
  weekday: number,
  startMin: number,
  turnOn?: boolean,
): WindowDraft[] {
  const others = windows.filter((window) => window.weekday !== weekday);
  const slots = new Set<number>();
  for (const window of windows.filter((item) => item.weekday === weekday)) {
    for (let minute = window.start_minute; minute < window.end_minute; minute += SLOT_MINUTES) {
      slots.add(minute);
    }
  }
  const enabled = turnOn ?? !slots.has(startMin);
  if (enabled) slots.add(startMin);
  else slots.delete(startMin);

  const day: WindowDraft[] = [];
  for (const start of [...slots].sort((a, b) => a - b)) {
    const last = day[day.length - 1];
    if (last && last.end_minute === start) last.end_minute = start + SLOT_MINUTES;
    else day.push({ weekday, start_minute: start, end_minute: start + SLOT_MINUTES });
  }
  return mergeWindows([...others, ...day]);
}

export function mergeWindows(input: WindowDraft[]): WindowDraft[] {
  const grouped = new Map<number, WindowDraft[]>();
  for (const item of input) {
    if (item.end_minute <= item.start_minute) continue;
    const list = grouped.get(item.weekday) ?? [];
    list.push({ ...item });
    grouped.set(item.weekday, list);
  }

  const merged: WindowDraft[] = [];
  for (const [weekday, list] of grouped) {
    list.sort((a, b) => a.start_minute - b.start_minute);
    let current = list[0];
    for (const next of list.slice(1)) {
      if (next.start_minute <= current.end_minute) {
        current = { weekday, start_minute: current.start_minute, end_minute: Math.max(current.end_minute, next.end_minute) };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
  }
  return merged.sort((a, b) => a.weekday - b.weekday || a.start_minute - b.start_minute);
}