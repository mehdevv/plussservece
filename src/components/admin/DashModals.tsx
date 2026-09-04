import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AvailabilityWindow, Lead, Meeting } from "../../lib/types";
import { BDR_LABEL, deletePhrase, isBdr, type DashboardAccount } from "../../lib/auth";
import { bookingError, formatMinutes, formatWhen, fromAlgiers, parseTimeInput, todayYmd } from "../../lib/time";

const DURATIONS = [30, 45, 60];

type BookDraft = {
  leadId: string;
  ymd: string;
  startMin: number;
};

export function DeleteLeadModal({
  lead,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  lead: Lead;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (phrase: string) => void;
}) {
  const phrase = deletePhrase(lead.full_name);
  const [value, setValue] = useState("");
  const matches = value.trim() === phrase;

  return (
    <div className="dash-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="dash-modal" role="dialog" aria-labelledby="delete-lead-title" onClick={(e) => e.stopPropagation()}>
        <p className="cal-kicker">Delete lead</p>
        <h2 id="delete-lead-title">Rewrite the phrase to confirm</h2>
        <p>
          This removes <strong>{lead.full_name}</strong> ({lead.business_name}) from the inbox permanently.
        </p>
        <p className="delete-phrase">{phrase}</p>
        <label>
          Rewrite the phrase above
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={phrase}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dash-modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" type="button" disabled={!matches || busy} onClick={() => onConfirm(value.trim())}>
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BookMeetingModal({
  account,
  leads,
  windows,
  meetings,
  draft,
  busy,
  error,
  onClose,
  onBook,
}: {
  account: DashboardAccount;
  leads: Lead[];
  windows: AvailabilityWindow[];
  meetings: Meeting[];
  draft: BookDraft;
  busy: boolean;
  error: string;
  onClose: () => void;
  onBook: (input: { leadId: string; startsAt: Date; endsAt: Date; notes: string }) => void;
}) {
  const [leadId, setLeadId] = useState(draft.leadId);
  const [ymd, setYmd] = useState(draft.ymd || todayYmd());
  const [start, setStart] = useState(formatMinutes(draft.startMin));
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setLeadId(draft.leadId);
    setYmd(draft.ymd || todayYmd());
    setStart(formatMinutes(draft.startMin));
  }, [draft]);

  const startMin = parseTimeInput(start) ?? 0;
  const startsAt = fromAlgiers(ymd, startMin);
  const endsAt = fromAlgiers(ymd, startMin + duration);
  const localError = useMemo(
    () => bookingError(windows, meetings, startsAt, endsAt),
    [windows, meetings, startsAt, endsAt],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!leadId) return;
    if (localError) return;
    onBook({ leadId, startsAt, endsAt, notes });
  }

  return (
    <div className="dash-modal-backdrop" role="presentation" onClick={onClose}>
      <form className="dash-modal lead-form" role="dialog" aria-labelledby="book-meeting-title" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <p className="cal-kicker">{account.label}</p>
        <h2 id="book-meeting-title">Schedule a meeting</h2>
        <p>The slot has to stay inside the owner’s meeting zone and cannot overlap another BDR booking.</p>
        <label>
          Lead
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
            <option value="">Select a lead</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.full_name} · {lead.business_name}
              </option>
            ))}
          </select>
        </label>
        {!leads.length ? <p className="form-error">No leads are assigned to you yet.</p> : null}
        <div className="field-row">
          <label>
            Date
            <input type="date" value={ymd} onChange={(e) => setYmd(e.target.value)} required />
          </label>
          <label>
            Start
            <input type="time" step={1800} value={start} onChange={(e) => setStart(e.target.value)} required />
          </label>
        </div>
        <label>
          Duration
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {DURATIONS.map((item) => (
              <option key={item} value={item}>
                {item} minutes
              </option>
            ))}
          </select>
        </label>
        <label>
          Notes <span className="optional">optional</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call notes, Zoom, etc." />
        </label>
        {localError ? <p className="form-error">{localError}</p> : <p className="form-micro">Ends at {formatWhen(endsAt.toISOString())}.</p>}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dash-modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={busy || !leadId || Boolean(localError)}>
            {busy ? "Booking…" : "Book meeting"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function MeetingModal({
  account,
  meeting,
  busy,
  error,
  onClose,
  onCancel,
}: {
  account: DashboardAccount;
  meeting: Meeting;
  busy: boolean;
  error: string;
  onClose: () => void;
  onCancel: () => void;
}) {
  const canCancel = account.role === "admin" || (isBdr(account.role) && meeting.bdr_id === account.role);
  return (
    <div className="dash-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="dash-modal" role="dialog" aria-labelledby="meeting-title" onClick={(e) => e.stopPropagation()}>
        <p className="cal-kicker">{BDR_LABEL[meeting.bdr_id]}</p>
        <h2 id="meeting-title">{meeting.lead_name || "Meeting"}</h2>
        <p>
          {formatWhen(meeting.starts_at)} → {formatWhen(meeting.ends_at).split(", ").slice(-1)[0]}
        </p>
        {meeting.notes ? <p>{meeting.notes}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dash-modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
          {canCancel ? (
            <button className="btn btn-danger" type="button" disabled={busy} onClick={onCancel}>
              {busy ? "Cancelling…" : "Cancel meeting"}
            </button>
          ) : (
            <p className="form-micro">Only {BDR_LABEL[meeting.bdr_id]} or the owner can cancel this slot.</p>
          )}
        </div>
      </div>
    </div>
  );
}