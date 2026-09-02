import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listLeads, updateLeadNotes, updateLeadStatus } from "../lib/leads";
import { getSupabase } from "../lib/supabase";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "../lib/types";
import { useSession } from "../lib/useSession";
import { leadWhatsAppUrl } from "../lib/whatsapp";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = Boolean(getSupabase());

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      setError("Add your Supabase keys to .env first.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setLoading(false);
  }

  return (
    <main className="admin-shell">
      <div className="admin-login">
        <img src="/logo.png" alt="" width={48} height={48} className="brand-logo" />
        <h1>Lead inbox</h1>
        <p>Sign in to see website signups saved in Supabase.</p>
        <form className="lead-form" onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          {!configured ? <p className="form-error">Supabase is not configured yet.</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading || !configured}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link to="/">Back to website</Link>
      </div>
    </main>
  );
}

export function AdminPage() {
  const { session, loading } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [loadError, setLoadError] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  async function refresh() {
    try {
      const rows = await listLeads();
      setLeads(rows);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load leads.");
    }
  }

  useEffect(() => {
    if (!session) return;
    void refresh();
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("leads-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session]);

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

  if (loading) {
    return (
      <main className="admin-shell">
        <p>Loading…</p>
      </main>
    );
  }

  if (!session) return <LoginCard />;

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
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => void getSupabase()?.auth.signOut()}
          >
            Sign out
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

      {loadError ? <p className="form-error">{loadError}</p> : null}

      <div className="lead-list">
        {filtered.length === 0 ? <p>No leads yet.</p> : null}
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
                onChange={(e) => void updateLeadStatus(lead.id, e.target.value as LeadStatus).then(refresh)}
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
                  void updateLeadNotes(lead.id, next);
                }}
              />
            </label>
          </article>
        ))}
      </div>
    </main>
  );
}
