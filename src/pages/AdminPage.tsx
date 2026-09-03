import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listLeads, updateLeadNotes, updateLeadStatus } from "../lib/leads";
import { getSupabase } from "../lib/supabase";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "../lib/types";
import { leadWhatsAppUrl } from "../lib/whatsapp";

const ADMIN_PASSWORD = "0505";
const STORAGE_KEY = "pluss-admin";
const INBOX_READ_SQL = `grant select, update on table public.leads to anon, authenticated;
drop policy if exists "Inbox can read leads" on public.leads;
drop policy if exists "Inbox can update leads" on public.leads;
create policy "Inbox can read leads" on public.leads for select to anon, authenticated using (true);
create policy "Inbox can update leads" on public.leads for update to anon, authenticated using (true) with check (true);`;

const STATUS_FILTERS = ["all", ...LEAD_STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

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
  });
}

function readUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

function LoginCard({
  onUnlock,
}: {
  onUnlock: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const configured = Boolean(getSupabase());

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.trim() !== ADMIN_PASSWORD) {
      setError("Wrong password.");
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, ADMIN_PASSWORD);
    } catch {
      /* ignore */
    }
    onUnlock();
  }

  return (
    <main className="admin-shell">
      <div className="admin-login">
        <img src="/logo.png" alt="" width={48} height={48} className="brand-logo" />
        <h1>Lead inbox</h1>
        <p>Enter the admin password to see website signups.</p>
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
            Open inbox
          </button>
        </form>
        <Link to="/">Back to website</Link>
      </div>
    </main>
  );
}

export function AdminPage() {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listLeads(ADMIN_PASSWORD);
      setLeads(rows);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!unlocked) return;
    void refresh();
  }, [unlocked]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const statusOk = status === "all" || lead.status === status;
      const text = `${lead.full_name} ${lead.business_name} ${lead.email} ${lead.phone} ${lead.city ?? ""} ${lead.service ?? ""}`.toLowerCase();
      return statusOk && (!needle || text.includes(needle));
    });
  }, [leads, query, status]);

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
      await updateLeadStatus(ADMIN_PASSWORD, id, next);
    } catch {
      void refresh();
    }
  }

  if (!unlocked) return <LoginCard onUnlock={() => setUnlocked(true)} />;

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <div className="brand">
          <img src="/logo.png" alt="" width={36} height={36} className="brand-logo" />
          <span className="brand-word">
            Pluss<span>.dev</span> inbox
          </span>
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
              setUnlocked(false);
            }}
          >
            Lock
          </button>
        </div>
      </header>

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
        {loading ? <p className="admin-loading">Loading…</p> : <p className="admin-loading">{filtered.length} shown</p>}
      </section>

      {loadError ? <p className="form-error">{loadError}</p> : null}

      {!loading && filtered.length === 0 ? (
        <div className="admin-empty">
          <p>
            No leads loaded. If they already exist in Supabase, run this in the SQL editor, then click Refresh:
          </p>
          <pre>{INBOX_READ_SQL}</pre>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => void navigator.clipboard.writeText(INBOX_READ_SQL)}
          >
            Copy SQL
          </button>
        </div>
      ) : (
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
                        void updateLeadNotes(ADMIN_PASSWORD, lead.id, next);
                      }}
                    />
                  </td>
                  <td>
                    <a className="btn btn-whatsapp" href={leadWhatsAppUrl(lead.phone, lead.full_name)} target="_blank" rel="noopener">
                      WA
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
