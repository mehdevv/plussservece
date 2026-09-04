import { getSupabase } from "./supabase";
import { resolveAccount } from "./auth";
import type { BdrId, Lead, LeadInput, LeadStatus } from "./types";
import { SetupRequiredError } from "./schedule";

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value: string) {
  return value.replace(/\D/g, "").length >= 8;
}

function normalizeLead(row: Lead): Lead {
  return { ...row, assigned_to: row.assigned_to ?? null };
}

export async function createLead(input: LeadInput) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add your project URL and anon key to .env");
  }

  const { error } = await supabase.from("leads").insert({
    full_name: input.full_name.trim(),
    business_name: input.business_name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    city: input.city.trim() || null,
    business_type: input.business_type.trim() || null,
    service: input.service.trim() || null,
    message: input.message.trim() || null,
    source: "website",
  });

  if (error) throw new Error(error.message);
}

async function listLeadsFromTable() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw new Error(error.message);
  return ((data ?? []) as Lead[]).map(normalizeLead);
}

function missingFn(message: string) {
  return /could not find the function|schema cache/i.test(message);
}

export async function listLeads(password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const dash = await supabase.rpc("dashboard_list_leads", { p_password: password });
  if (!dash.error) return ((dash.data ?? []) as Lead[]).map(normalizeLead);

  const account = resolveAccount(password);
  if (account?.role === "admin") {
    const legacy = await supabase.rpc("admin_list_leads", { p_password: password });
    if (!legacy.error) return ((legacy.data ?? []) as Lead[]).map(normalizeLead);
    try {
      return await listLeadsFromTable();
    } catch {
      if (missingFn(dash.error.message)) throw new SetupRequiredError();
      throw new Error(dash.error.message);
    }
  }

  if (missingFn(dash.error.message)) throw new SetupRequiredError();
  throw new Error(dash.error.message);
}

export async function updateLeadStatus(password: string, id: string, status: LeadStatus) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const dash = await supabase.rpc("dashboard_update_lead", {
    p_password: password,
    p_id: id,
    p_status: status,
    p_notes: null,
  });
  if (!dash.error) return;

  const account = resolveAccount(password);
  if (account?.role === "admin") {
    const rpc = await supabase.rpc("admin_update_lead", {
      p_password: password,
      p_id: id,
      p_status: status,
      p_notes: null,
    });
    if (!rpc.error) return;
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (!error) return;
  }

  if (missingFn(dash.error.message)) throw new SetupRequiredError();
  throw new Error(dash.error.message);
}

export async function updateLeadNotes(password: string, id: string, notes: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const dash = await supabase.rpc("dashboard_update_lead", {
    p_password: password,
    p_id: id,
    p_status: null,
    p_notes: notes,
  });
  if (!dash.error) return;

  const account = resolveAccount(password);
  if (account?.role === "admin") {
    const rpc = await supabase.rpc("admin_update_lead", {
      p_password: password,
      p_id: id,
      p_status: null,
      p_notes: notes,
    });
    if (!rpc.error) return;
    const { error } = await supabase.from("leads").update({ notes }).eq("id", id);
    if (!error) return;
  }

  if (missingFn(dash.error.message)) throw new SetupRequiredError();
  throw new Error(dash.error.message);
}

export async function assignLead(password: string, id: string, assignedTo: BdrId | null) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("dashboard_assign_lead", {
    p_password: password,
    p_id: id,
    p_assigned_to: assignedTo ?? "",
  });
  if (error) {
    if (/could not find the function|schema cache/i.test(error.message)) throw new SetupRequiredError();
    throw new Error(error.message);
  }
}

export async function deleteLead(password: string, id: string, confirm: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("dashboard_delete_lead", {
    p_password: password,
    p_id: id,
    p_confirm: confirm,
  });
  if (error) {
    if (/could not find the function|schema cache/i.test(error.message)) throw new SetupRequiredError();
    throw new Error(error.message);
  }
}