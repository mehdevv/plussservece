import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AvailabilityWindow } from "../../lib/types";
import { WEEKDAYS, formatMinutes, mergeWindows, parseTimeInput } from "../../lib/time";

type Draft = {
  weekday: number;
  start_minute: number;
  end_minute: number;
};

type Props = {
  windows: AvailabilityWindow[];
  saving: boolean;
  error?: string;
  onSave: (windows: Draft[]) => Promise<void>;
};

export function AvailabilityEditor({ windows, saving, error, onSave }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(toDrafts(windows));
  const [localError, setLocalError] = useState("");
  const [adding, setAdding] = useState<Record<number, { start: string; end: string }>>({});

  useEffect(() => {
    setDrafts(toDrafts(windows));
  }, [windows]);

  const grouped = useMemo(() => {
    return WEEKDAYS.map((day) => ({
      ...day,
      windows: drafts.filter((item) => item.weekday === day.iso),
    }));
  }, [drafts]);

  async function save(next: Draft[]) {
    const merged = mergeWindows(next);
    setDrafts(merged);
    setLocalError("");
    try {
      await onSave(merged);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not save availability.");
    }
  }

  function addWindow(weekday: number, event: FormEvent) {
    event.preventDefault();
    const times = adding[weekday] ?? { start: "09:00", end: "17:00" };
    const start = parseTimeInput(times.start);
    const end = parseTimeInput(times.end);
    if (start === null || end === null || end <= start) {
      setLocalError("Pick a start time before the end time.");
      return;
    }
    void save([...drafts, { weekday, start_minute: start, end_minute: end }]);
  }

  function updateWindow(target: Draft, nextStart: string, nextEnd: string) {
    const start = parseTimeInput(nextStart);
    const end = parseTimeInput(nextEnd);
    if (start === null || end === null || end <= start) {
      setLocalError("Pick a start time before the end time.");
      return;
    }
    void save(
      drafts.map((item) =>
        item === target ? { ...item, start_minute: start, end_minute: end } : item,
      ),
    );
  }

  const message = localError || error || "";

  return (
    <section className="avail-card">
      <div className="avail-head">
        <div>
          <p className="cal-kicker">Meeting zone</p>
          <h2>Weekly availability</h2>
        </div>
        <p>Edit the hours below, or paint slots on the calendar. Changes apply every week.</p>
      </div>
      {message ? <p className="form-error">{message}</p> : null}
      <div className="avail-days">
        {grouped.map((day) => {
          const times = adding[day.iso] ?? { start: "09:00", end: "17:00" };
          return (
            <div key={day.iso} className="avail-day">
              <strong>{day.label}</strong>
              <div className="avail-chips">
                {day.windows.length === 0 ? <span className="avail-closed">Closed</span> : null}
                {day.windows.map((window, index) => (
                  <span key={`${window.weekday}-${window.start_minute}-${window.end_minute}-${index}`} className="avail-chip is-edit">
                    <input
                      type="time"
                      step={1800}
                      value={formatMinutes(window.start_minute)}
                      disabled={saving}
                      onChange={(e) => {
                        const start = parseTimeInput(e.target.value);
                        if (start === null) return;
                        setDrafts((current) =>
                          current.map((item) =>
                            item.weekday === window.weekday &&
                            item.start_minute === window.start_minute &&
                            item.end_minute === window.end_minute
                              ? { ...item, start_minute: start }
                              : item,
                          ),
                        );
                      }}
                      onBlur={(e) => updateWindow(window, e.target.value, formatMinutes(window.end_minute))}
                    />
                    <span>–</span>
                    <input
                      type="time"
                      step={1800}
                      value={formatMinutes(window.end_minute)}
                      disabled={saving}
                      onChange={(e) => {
                        const end = parseTimeInput(e.target.value);
                        if (end === null) return;
                        setDrafts((current) =>
                          current.map((item) =>
                            item.weekday === window.weekday &&
                            item.start_minute === window.start_minute &&
                            item.end_minute === window.end_minute
                              ? { ...item, end_minute: end }
                              : item,
                          ),
                        );
                      }}
                      onBlur={(e) => updateWindow(window, formatMinutes(window.start_minute), e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Remove window"
                      disabled={saving}
                      onClick={() =>
                        void save(
                          drafts.filter(
                            (item) =>
                              !(
                                item.weekday === window.weekday &&
                                item.start_minute === window.start_minute &&
                                item.end_minute === window.end_minute
                              ),
                          ),
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form className="avail-add" onSubmit={(event) => addWindow(day.iso, event)}>
                <input
                  type="time"
                  step={1800}
                  value={times.start}
                  disabled={saving}
                  onChange={(e) => setAdding((current) => ({ ...current, [day.iso]: { ...times, start: e.target.value } }))}
                />
                <input
                  type="time"
                  step={1800}
                  value={times.end}
                  disabled={saving}
                  onChange={(e) => setAdding((current) => ({ ...current, [day.iso]: { ...times, end: e.target.value } }))}
                />
                <button className="btn btn-ghost" type="submit" disabled={saving}>
                  Add hours
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function toDrafts(windows: AvailabilityWindow[]): Draft[] {
  return windows.map((window) => ({
    weekday: window.weekday,
    start_minute: window.start_minute,
    end_minute: window.end_minute,
  }));
}