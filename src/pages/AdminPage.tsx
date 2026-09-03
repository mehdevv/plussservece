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
  const [status, setStatus] = useState<LeadStatus | "all">("all");
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

  const counts = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => lead.status === "new").length,
      booked: leads.filter((lead) => lead.status === "booked").length,
    }),
    [leads]
  );

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
        <article>
          <strong>{counts.total}</strong>
          <span>Total leads</span>
        </article>
        <article>
          <strong>{counts.new}</strong>
          <span>New</span>
        </article>
        <article>
          <strong>{counts.booked}</strong>
          <span>Booked</span>
        </article>
      </section>

      <section className="admin-filters">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, business, phone…"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | "all")}>
          <option value="all">All statuses</option>
          {LEAD_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      {loading ? <p>Loading…</p> : null}
      {loadError ? <p className="form-error">{loadError}</p> : null}

      <div className="lead-list">
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
        ) : null}
        {filtered.map((lead) => (
          <article className="lead-item" key={lead.id}>
            <div className="lead-item-top">
              <div>
                <h2>
                  {lead.full_name} · {lead.business_name}
                </h2>
                <p>
                  {lead.service ? `${lead.service} · ` : ""}
                  {lead.phone} · {lead.email}
                  {lead.city ? ` · ${lead.city}` : ""}
                  {lead.business_type ? ` · ${lead.business_type}` : ""}
                </p>
              </div>
              <span className={`status-pill status-${lead.status}`}>{lead.status}</span>
            </div>
            {lead.message ? <p className="lead-message">{lead.message}</p> : null}
            <div className="lead-item-actions">
              <select
                value={lead.status}
                onChange={(e) =>
                  void updateLeadStatus(ADMIN_PASSWORD, lead.id, e.target.value as LeadStatus).then(refresh)
                }
              >
                {LEAD_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <a className="btn btn-whatsapp" href={leadWhatsAppUrl(lead.phone, lead.full_name)} target="_blank" rel="noopener">
                WhatsApp
              </a>
              <span className="lead-date">{formatDate(lead.created_at)}</span>
            </div>
            <label className="notes-label">
              Notes
              <textarea
                rows={2}
                value={notesDraft[lead.id] ?? lead.notes ?? ""}
                onChange={(e) => setNotesDraft((current) => ({ ...current, [lead.id]: e.target.value }))}
                onBlur={() => {
                  const next = notesDraft[lead.id];
                  if (next === undefined || next === (lead.notes ?? "")) return;
                  void updateLeadNotes(ADMIN_PASSWORD, lead.id, next);
                }}
              />
            </label>
          </article>
        ))}
      </div>
    </main>
  );
}
