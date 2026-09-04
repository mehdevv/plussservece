import { useEffect, useRef } from "react";
import type { AvailabilityWindow, Meeting } from "../../lib/types";
import { BDR_LABEL, isBdr, type DashboardAccount } from "../../lib/auth";
import { bdrTone } from "../../lib/schedule";
import {
  SLOT_MINUTES,
  addDaysYmd,
  formatDayHeading,
  formatMinutes,
  formatWeekRange,
  fromAlgiers,
  gridBounds,
  isoWeekday,
  meetingBlocksSlot,
  mondayOfWeek,
  slotMinutes,
  todayYmd,
  weekDays,
  windowCovers,
} from "../../lib/time";

type Props = {
  account: DashboardAccount;
  weekStart: string;
  windows: AvailabilityWindow[];
  meetings: Meeting[];
  saving?: boolean;
  onWeekChange: (mondayYmd: string) => void;
  onSlotClick: (ymd: string, startMin: number) => void;
  onPaintZone?: (weekday: number, startMin: number, turnOn: boolean) => void;
  onMeetingClick: (meeting: Meeting) => void;
};

export function WeekCalendar({
  account,
  weekStart,
  windows,
  meetings,
  saving,
  onWeekChange,
  onSlotClick,
  onPaintZone,
  onMeetingClick,
}: Props) {
  const days = weekDays(weekStart);
  const canBook = isBdr(account.role);
  const canEditZone = account.role === "admin" && Boolean(onPaintZone);
  const { start, end } = gridBounds(windows, { editor: canEditZone });
  const slots = slotMinutes(start, end);
  const slotHeight = 28;
  const today = todayYmd();
  const gridHeight = slots.length * slotHeight;
  const paint = useRef<boolean | null>(null);

  useEffect(() => {
    const stop = () => {
      paint.current = null;
    };
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  return (
    <section className="cal-wrap">
      <div className="cal-toolbar">
        <div>
          <p className="cal-kicker">Week view · Africa/Algiers</p>
          <h2>{formatWeekRange(weekStart)}</h2>
          {canEditZone ? (
            <p className="cal-hint">Click or drag green and grey slots to open or close that hour every week.</p>
          ) : null}
        </div>
        <div className="cal-week-nav">
          <button className="btn btn-ghost" type="button" onClick={() => onWeekChange(addDaysYmd(weekStart, -7))}>
            Previous
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => onWeekChange(mondayOfWeek(todayYmd()))}>
            This week
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => onWeekChange(addDaysYmd(weekStart, 7))}>
            Next
          </button>
        </div>
      </div>

      <div className="cal-legend">
        <span className="cal-chip is-zone">Meeting zone</span>
        <span className={`cal-chip ${bdrTone("bdr1")}`}>{BDR_LABEL.bdr1}</span>
        <span className={`cal-chip ${bdrTone("bdr2")}`}>{BDR_LABEL.bdr2}</span>
        <span className="cal-chip is-off">Outside hours</span>
        {saving ? <span className="cal-chip is-off">Saving…</span> : null}
      </div>

      <div className="cal-scroll">
        <div className={`cal-grid${canEditZone ? " is-editing" : ""}`}>
          <div className="cal-head-cell cal-time-gutter" />
          {days.map((ymd) => (
            <div key={ymd} className={`cal-head-cell${ymd === today ? " is-today" : ""}`}>
              <strong>{formatDayHeading(ymd)}</strong>
              <span>{windows.some((window) => window.weekday === isoWeekday(ymd)) ? "Open" : "Closed"}</span>
            </div>
          ))}

          <div className="cal-time-gutter" style={{ height: gridHeight }}>
            {slots.map((minute) => (
              <div key={minute} className="cal-time-label" style={{ height: slotHeight }}>
                {minute % 60 === 0 ? formatMinutes(minute) : ""}
              </div>
            ))}
          </div>

          {days.map((ymd) => (
            <div key={ymd} className={`cal-day${ymd === today ? " is-today" : ""}`} style={{ height: gridHeight }}>
              {slots.map((minute) => {
                const endMin = minute + SLOT_MINUTES;
                const inZone = windowCovers(windows, ymd, minute, endMin);
                const taken = meetings.some((meeting) => meetingBlocksSlot(meeting, ymd, minute, endMin));
                const past = fromAlgiers(ymd, endMin).getTime() <= Date.now();
                const free = inZone && !taken && !past;
                const interactive = canEditZone || (canBook && free);
                return (
                  <button
                    key={minute}
                    type="button"
                    className={`cal-slot${inZone ? " is-zone" : " is-off"}${past && !canEditZone ? " is-past" : ""}${free ? " is-free" : ""}${canEditZone ? " is-editable" : ""}`}
                    style={{ height: slotHeight }}
                    disabled={!interactive}
                    onMouseDown={(event) => {
                      if (!canEditZone || !onPaintZone) return;
                      event.preventDefault();
                      paint.current = !inZone;
                      onPaintZone(isoWeekday(ymd), minute, paint.current);
                    }}
                    onMouseEnter={() => {
                      if (!canEditZone || !onPaintZone || paint.current === null) return;
                      onPaintZone(isoWeekday(ymd), minute, paint.current);
                    }}
                    onClick={() => {
                      if (canEditZone) return;
                      onSlotClick(ymd, minute);
                    }}
                    aria-label={`${formatDayHeading(ymd)} ${formatMinutes(minute)}`}
                  />
                );
              })}
              {meetings
                .filter((meeting) => {
                  const dayStart = fromAlgiers(ymd, start);
                  const dayEnd = fromAlgiers(ymd, end);
                  return new Date(meeting.starts_at) < dayEnd && new Date(meeting.ends_at) > dayStart;
                })
                .map((meeting) => {
                  const dayStart = fromAlgiers(ymd, start);
                  const dayEnd = fromAlgiers(ymd, end);
                  const eventStart = Math.max(new Date(meeting.starts_at).getTime(), dayStart.getTime());
                  const eventEnd = Math.min(new Date(meeting.ends_at).getTime(), dayEnd.getTime());
                  const top = ((eventStart - dayStart.getTime()) / 60000 / SLOT_MINUTES) * slotHeight;
                  const height = Math.max(((eventEnd - eventStart) / 60000 / SLOT_MINUTES) * slotHeight - 2, 18);
                  return (
                    <button
                      key={meeting.id}
                      type="button"
                      className={`cal-event ${bdrTone(meeting.bdr_id)}`}
                      style={{ top, height }}
                      onClick={() => onMeetingClick(meeting)}
                    >
                      <strong>{meeting.lead_name || "Meeting"}</strong>
                      <span>{BDR_LABEL[meeting.bdr_id]}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}