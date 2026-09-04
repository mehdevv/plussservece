import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import scheduleSql from "../lib/schedule.setup.sql?raw";
import { AvailabilityEditor } from "../components/admin/AvailabilityEditor";
import { BookMeetingModal, DeleteLeadModal, MeetingModal } from "../components/admin/DashModals";
import { WeekCalendar } from "../components/admin/WeekCalendar";
import {
  ACCOUNTS,
  BDR_LABEL,
  STORAGE_KEY,
  isBdr,
  resolveAccount,
  type DashboardAccount,
} from "../lib/auth";
import { assignLead, deleteLead, listLeads, updateLeadNotes, updateLeadStatus } from "../lib/leads";
import { SetupRequiredError, bookMeeting, cancelMeeting, listAvailability, listMeetings, saveAvailability } from "../lib/schedule";
import { getSupabase } from "../lib/supabase";
import { BDR_IDS, LEAD_STATUSES, type AvailabilityWindow, type BdrId, type Lead, type LeadStatus, type Meeting } from "../lib/types";
import { fromAlgiers, mondayOfWeek, todayYmd, addDaysYmd, toggleWeekSlot } from "../lib/time";
import { leadWhatsAppUrl } from "../lib/whatsapp";

const STATUS_FILTERS = ["all", ...LEAD_STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
type AssignFilter = "all" | "unassigned" | BdrId;
type Tab = "leads" | "calendar";

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "All",
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  won: "Won",
  lost: "Lost",
};

function serviceLabel(value: string | null) {
  if (!value) return "—";
  if (value === "mix") return "Mix";
  return value.toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Algiers",
  });
}

function readAccount() {
  try {
    return resolveAccount(sessionStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return null;
  }
}

function LoginCard({ onUnlock }: { onUnlock: (account: DashboardAccount) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const configured = Boolean(getSupabase());

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const account = resolveAccount(password.trim());
    if (!account) {
      setError("Wrong password.");
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, account.password);
    } catch {
      /* ignore */
    }
    onUnlock(account);
  }

  return (
    <main className="admin-shell">
      <div className="admin-login">
        <img src="/logo.png" alt="" width={48} height={48} className="brand-logo" />
        <h1>Dashboard</h1>
        <p>Owner and BDR accounts use different passwords. Leads, assignment, and the weekly calendar live here.</p>
        <form className="lead-form" onSubmit={onSubmit}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputMode="numeric"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          {!configured ? <p className="form-error">Add your Supabase keys in `.env` first.</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={!configured}>
            Open dashboard
          </button>
        </form>
        <p className="form-micro">Owner · BDR 1 · BDR 2</p>
        <Link to="/">Back to website</Link>
      </div>
    </main>
  );
}

export function AdminPage() {
  const [account, setAccount] = useState<DashboardAccount | null>(readAccount);
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [weekStart, setWeekStart] = useState(() => mondayOfWeek(todayYmd()));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [assignFilter, setAssignFilter] = useState<AssignFilter>("all");
  const [loadError, setLoadError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [availError, setAvailError] = useState("");
  const paintSaveTimer = useRef<number | null>(null);
  const pendingWindows = useRef<AvailabilityWindow[] | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [booking, setBooking] = useState<{ leadId: string; ymd: string; startMin: number } | null>(null);
  const [bookBusy, setBookBusy] = useState(false);
  const [bookError, setBookError] = useState("");
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [meetingBusy, setMeetingBusy] = useState(false);
  const [meetingError, setMeetingError] = useState("");

  const password = account?.password ?? "";

  async function refreshLeads() {
    const rows = await listLeads(password);
    setLeads(rows);
  }

  async function refreshSchedule() {
    const [nextWindows, nextMeetings] = await Promise.all([
      listAvailability(password),
      listMeetings(password, fromAlgiers(weekStart, 0), fromAlgiers(addDaysYmd(weekStart, 7), 0)),
    ]);
    setWindows(nextWindows);
    setMeetings(nextMeetings);
    setNeedsSetup(false);
  }

  async function refresh() {
    if (!account) return;
    setLoading(true);
    try {
      await refreshLeads();
      setLoadError("");
      try {
        await refreshSchedule();
      } catch (error) {
        if (error instanceof SetupRequiredError) setNeedsSetup(true);
        else setLoadError(error instanceof Error ? error.message : "Could not load the calendar.");
      }
    } catch (error) {
      if (error instanceof SetupRequiredError) setNeedsSetup(true);
      else setLoadError(error instanceof Error ? error.message : "Could not load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!account) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useEffect(() => {
    if (!account || needsSetup) return;
    void refreshSchedule().catch((error) => {
      if (error instanceof SetupRequiredError) setNeedsSetup(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const statusOk = status === "all" || lead.status === status;
      const assignOk =
        assignFilter === "all" ||
        (assignFilter === "unassigned" && !lead.assigned_to) ||
        lead.assigned_to === assignFilter;
      const text = `${lead.full_name} ${lead.business_name} ${lead.email} ${lead.phone} ${lead.city ?? ""} ${lead.service ?? ""}`.toLowerCase();
      return statusOk && assignOk && (!needle || text.includes(needle));
    });
  }, [leads, query, status, assignFilter]);

  const counts = useMemo(() => {
    const next: Record<StatusFilter, number> = {
      all: leads.length,
      new: 0,
      contacted: 0,
      booked: 0,
      won: 0,
      lost: 0,
    };
    for (const lead of leads) next[lead.status] += 1;
    return next;
  }, [leads]);

  async function changeStatus(id: string, next: LeadStatus) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status: next } : lead)));
    try {
      await updateLeadStatus(password, id, next);
    } catch {
      void refresh();
    }
  }

  async function persistWindows(next: { weekday: number; start_minute: number; end_minute: number }[]) {
    setSavingAvail(true);
    setAvailError("");
    try {
      const saved = await saveAvailability(password, next);
      pendingWindows.current = null;
      setWindows(saved);
    } catch (error) {
      setAvailError(error instanceof Error ? error.message : "Could not save availability.");
      throw error;
    } finally {
      setSavingAvail(false);
    }
  }

  function paintZone(weekday: number, startMin: number, turnOn: boolean) {
    setWindows((current) => {
      const next = toggleWeekSlot(current, weekday, startMin, turnOn);
      const withIds = next.map((item, index) => ({
        id: current.find((row) => row.weekday === item.weekday && row.start_minute === item.start_minute)?.id ?? `tmp-${index}`,
        weekday: item.weekday,
        start_minute: item.start_minute,
        end_minute: item.end_minute,
      }));
      pendingWindows.current = withIds;
      return withIds;
    });
    if (paintSaveTimer.current) window.clearTimeout(paintSaveTimer.current);
    paintSaveTimer.current = window.setTimeout(() => {
      const next = pendingWindows.current;
      if (!next) return;
      void persistWindows(next).catch(() => {
        void refreshSchedule();
      });
    }, 280);
  }

  useEffect(() => {
    const flush = () => {
      if (paintSaveTimer.current) {
        window.clearTimeout(paintSaveTimer.current);
        paintSaveTimer.current = null;
      }
      const next = pendingWindows.current;
      if (!next || savingAvail) return;
      void persistWindows(next).catch(() => {
        void refreshSchedule();
      });
    };
    window.addEventListener("mouseup", flush);
    window.addEventListener("touchend", flush);
    return () => {
      window.removeEventListener("mouseup", flush);
      window.removeEventListener("touchend", flush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, savingAvail]);

  async function changeAssignee(id: string, next: BdrId | "") {
    const assigned = next || null;
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, assigned_to: assigned } : lead)));
    try {
      await assignLead(password, id, assigned);
    } catch (error) {
      if (error instanceof SetupRequiredError) setNeedsSetup(true);
      void refresh();
    }
  }

  if (!account) return <LoginCard onUnlock={setAccount} />;

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <div className="brand">
          <img src="/logo.png" alt="" width={36} height={36} className="brand-logo" />
          <span className="brand-word">
            Pluss<span>.dev</span>
          </span>
          <span className={`admin-role-pill ${account.role}`}>{account.label}</span>
        </div>
        <div className="admin-top-actions">
          <Link to="/">Website</Link>
          <button className="btn btn-ghost" type="button" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem(STORAGE_KEY);
              } catch {
                /* ignore */
              }
              setAccount(null);
            }}
          >
            Lock
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Dashboard">
        <button type="button" className={tab === "leads" ? "is-active" : ""} onClick={() => setTab("leads")}>
          Leads
        </button>
        <button type="button" className={tab === "calendar" ? "is-active" : ""} onClick={() => setTab("calendar")}>
          Calendar
        </button>
      </nav>

      {needsSetup ? (
        <div className="admin-empty">
          <p>
            {account.role === "admin"
              ? "Run this SQL in the Supabase editor once to enable assignment, delete, and the weekly calendar. Then click Refresh."
              : "The owner still needs to run the calendar setup SQL in Supabase. Ask them to do that, then refresh."}
          </p>
          {account.role === "admin" ? (
            <>
              <pre>{scheduleSql}</pre>
              <button className="btn btn-ghost" type="button" onClick={() => void navigator.clipboard.writeText(scheduleSql)}>
                Copy SQL
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {loadError ? <p className="form-error">{loadError}</p> : null}

      {tab === "leads" ? (
        <>
          <section className="admin-stats">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                className={`admin-stat status-tone-${item}${status === item ? " is-active" : ""}`}
                onClick={() => setStatus(item)}
              >
                <strong>{counts[item]}</strong>
                <span>{STATUS_LABEL[item]}</span>
              </button>
            ))}
          </section>

          <section className="admin-filters">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, business, phone, email…"
            />
            {account.role === "admin" ? (
              <select value={assignFilter} onChange={(e) => setAssignFilter(e.target.value as AssignFilter)}>
                <option value="all">All BDRs</option>
                <option value="unassigned">Unassigned</option>
                {BDR_IDS.map((id) => (
                  <option key={id} value={id}>
                    {BDR_LABEL[id]}
                  </option>
                ))}
              </select>
            ) : null}
            {loading ? <p className="admin-loading">Loading…</p> : <p className="admin-loading">{filtered.length} shown</p>}
          </section>

          {!loading && filtered.length === 0 && !needsSetup ? (
            <div className="admin-empty">
              <p>
                {leads.length === 0
                  ? account.role === "admin"
                    ? "No website signups yet."
                    : "No leads are assigned to you yet. The owner assigns website signups from this dashboard."
                  : "No leads match this filter."}
              </p>
            </div>
          ) : filtered.length ? (
            <div className="inbox-wrap">
              <table className="inbox-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Business</th>
                    <th>Service</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Message</th>
                    <th>Assigned</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className={`inbox-row status-tone-${lead.status}`}>
                      <td className="is-date">{formatDate(lead.created_at)}</td>
                      <td>
                        <strong>{lead.full_name}</strong>
                      </td>
                      <td>
                        {lead.business_name}
                        {lead.business_type ? <small>{lead.business_type}</small> : null}
                      </td>
                      <td>{serviceLabel(lead.service)}</td>
                      <td>
                        <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                      </td>
                      <td>
                        <a href={`mailto:${lead.email}`}>{lead.email}</a>
                      </td>
                      <td>{lead.city || "—"}</td>
                      <td className="is-message" title={lead.message ?? ""}>
                        {lead.message || "—"}
                      </td>
                      <td>
                        {account.role === "admin" ? (
                          <select
                            className="status-select"
                            value={lead.assigned_to ?? ""}
                            onChange={(e) => void changeAssignee(lead.id, e.target.value as BdrId | "")}
                          >
                            <option value="">Unassigned</option>
                            {BDR_IDS.map((id) => (
                              <option key={id} value={id}>
                                {BDR_LABEL[id]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          lead.assigned_to ? BDR_LABEL[lead.assigned_to] : "—"
                        )}
                      </td>
                      <td>
                        <select
                          className={`status-select status-tone-${lead.status}`}
                          value={lead.status}
                          onChange={(e) => void changeStatus(lead.id, e.target.value as LeadStatus)}
                        >
                          {LEAD_STATUSES.map((item) => (
                            <option key={item} value={item}>
                              {STATUS_LABEL[item]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="is-notes">
                        <input
                          value={notesDraft[lead.id] ?? lead.notes ?? ""}
                          placeholder="Add note"
                          onChange={(e) => setNotesDraft((current) => ({ ...current, [lead.id]: e.target.value }))}
                          onBlur={() => {
                            const next = notesDraft[lead.id];
                            if (next === undefined || next === (lead.notes ?? "")) return;
                            void updateLeadNotes(password, lead.id, next);
                          }}
                        />
                      </td>
                      <td>
                        <div className="inbox-actions">
                          <a className="btn btn-whatsapp" href={leadWhatsAppUrl(lead.phone, lead.full_name)} target="_blank" rel="noopener">
                            WA
                          </a>
                          {isBdr(account.role) ? (
                            <button
                              className="btn btn-tiny"
                              type="button"
                              onClick={() => {
                                setBookError("");
                                setBooking({ leadId: lead.id, ymd: todayYmd(), startMin: 9 * 60 });
                                setTab("calendar");
                              }}
                            >
                              Book
                            </button>
                          ) : (
                            <button
                              className="btn btn-tiny btn-danger-ghost"
                              type="button"
                              onClick={() => {
                                setDeleteError("");
                                setDeleting(lead);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : (
        <div className="cal-layout">
          {account.role === "admin" ? (
            <>
              <AvailabilityEditor
                windows={windows}
                saving={savingAvail}
                error={availError}
                onSave={persistWindows}
              />
              <aside className="bdr-card">
                <p className="cal-kicker">BDR logins</p>
                <h2>Share these with the team</h2>
                {ACCOUNTS.filter((item) => item.role !== "admin").map((item) => (
                  <p key={item.role}>
                    <strong>{item.label}</strong> · password {item.password}
                  </p>
                ))}
                <p className="form-micro">They open `/admin`, see only assigned leads, and book inside your meeting zone.</p>
              </aside>
            </>
          ) : (
            <p className="cal-hint">
              Green slots are inside the owner’s meeting zone. Click one to book a lead. Grey slots and other BDR
              meetings are blocked.
            </p>
          )}
          <WeekCalendar
            account={account}
            weekStart={weekStart}
            windows={windows}
            meetings={meetings}
            saving={savingAvail}
            onWeekChange={setWeekStart}
            onSlotClick={(ymd, startMin) => {
              setBookError("");
              setBooking({ leadId: "", ymd, startMin });
            }}
            onPaintZone={account.role === "admin" ? paintZone : undefined}
            onMeetingClick={(meeting) => {
              setMeetingError("");
              setActiveMeeting(meeting);
            }}
          />
        </div>
      )}

      {deleting ? (
        <DeleteLeadModal
          lead={deleting}
          busy={deleteBusy}
          error={deleteError}
          onClose={() => setDeleting(null)}
          onConfirm={(phrase) => {
            void (async () => {
              setDeleteBusy(true);
              setDeleteError("");
              try {
                await deleteLead(password, deleting.id, phrase);
                setLeads((current) => current.filter((lead) => lead.id !== deleting.id));
                setDeleting(null);
              } catch (error) {
                setDeleteError(error instanceof Error ? error.message : "Could not delete this lead.");
              } finally {
                setDeleteBusy(false);
              }
            })();
          }}
        />
      ) : null}

      {booking && isBdr(account.role) ? (
        <BookMeetingModal
          account={account}
          leads={leads}
          windows={windows}
          meetings={meetings}
          draft={booking}
          busy={bookBusy}
          error={bookError}
          onClose={() => setBooking(null)}
          onBook={(input) => {
            void (async () => {
              setBookBusy(true);
              setBookError("");
              try {
                await bookMeeting(password, input);
                setBooking(null);
                await refresh();
                setTab("calendar");
              } catch (error) {
                setBookError(error instanceof Error ? error.message : "Could not book this meeting.");
              } finally {
                setBookBusy(false);
              }
            })();
          }}
        />
      ) : null}

      {activeMeeting ? (
        <MeetingModal
          account={account}
          meeting={activeMeeting}
          busy={meetingBusy}
          error={meetingError}
          onClose={() => setActiveMeeting(null)}
          onCancel={() => {
            void (async () => {
              setMeetingBusy(true);
              setMeetingError("");
              try {
                await cancelMeeting(password, activeMeeting.id);
                setActiveMeeting(null);
                await refreshSchedule();
              } catch (error) {
                setMeetingError(error instanceof Error ? error.message : "Could not cancel this meeting.");
              } finally {
                setMeetingBusy(false);
              }
            })();
          }}
        />
      ) : null}
    </main>
  );
}