import { getSupabase } from "./supabase";
import type { Lead, LeadInput, LeadStatus } from "./types";

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value: string) {
  return value.replace(/\D/g, "").length >= 8;
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

export async function listLeads(password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.rpc("admin_list_leads", { p_password: password });
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

export async function updateLeadStatus(password: string, id: string, status: LeadStatus) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("admin_update_lead", {
    p_password: password,
    p_id: id,
    p_status: status,
    p_notes: null,
  });
  if (error) throw new Error(error.message);
}

export async function updateLeadNotes(password: string, id: string, notes: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("admin_update_lead", {
    p_password: password,
    p_id: id,
    p_status: null,
    p_notes: notes,
  });
  if (error) throw new Error(error.message);
}
