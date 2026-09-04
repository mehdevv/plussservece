import { getSupabase } from "./supabase";
import type { AvailabilityWindow, BdrId, Meeting } from "./types";
import { mergeWindows, type WindowDraft } from "./time";

export class SetupRequiredError extends Error {
  readonly setup = true;
  constructor(message = "Run the schedule SQL in Supabase to enable the calendar.") {
    super(message);
    this.name = "SetupRequiredError";
  }
}

function rpcMissing(message: string) {
  return /could not find the function|schema cache|does not exist|availability_windows|dashboard_/i.test(message);
}

function throwRpc(error: { message: string }): never {
  if (rpcMissing(error.message)) throw new SetupRequiredError();
  throw new Error(error.message);
}

export async function listAvailability(password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("dashboard_list_availability", { p_password: password });
  if (error) throwRpc(error);
  return (data ?? []) as AvailabilityWindow[];
}

export async function saveAvailability(password: string, windows: WindowDraft[]) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const payload = mergeWindows(windows).map((window) => ({
    weekday: window.weekday,
    start_minute: window.start_minute,
    end_minute: window.end_minute,
  }));

  const attempts = [
    () =>
      supabase.rpc("dashboard_set_availability", {
        p_password: password,
        p_windows: payload,
      }),
    () =>
      supabase.rpc("dashboard_set_availability", {
        p_password: password,
        p_windows: JSON.stringify(payload),
      }),
    () =>
      supabase.rpc("dashboard_set_availability_slots", {
        p_password: password,
        p_weekdays: payload.map((window) => window.weekday),
        p_starts: payload.map((window) => window.start_minute),
        p_ends: payload.map((window) => window.end_minute),
      }),
  ];

  let lastError: { message: string } | null = null;
  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) return (data ?? []) as AvailabilityWindow[];
    lastError = error;
  }
  const message = lastError?.message ?? "Could not save availability.";
  if (rpcMissing(message)) {
    throw new Error("Saving hours needs a SQL update. Re-run supabase/schedule.sql in the Supabase editor, then try again.");
  }
  throw new Error(message);
}

export async function listMeetings(password: string, from: Date, to: Date) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("dashboard_list_meetings", {
    p_password: password,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throwRpc(error);
  return (data ?? []) as Meeting[];
}

export async function bookMeeting(
  password: string,
  input: { leadId: string; startsAt: Date; endsAt: Date; notes?: string },
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("dashboard_book_meeting", {
    p_password: password,
    p_lead_id: input.leadId,
    p_starts_at: input.startsAt.toISOString(),
    p_ends_at: input.endsAt.toISOString(),
    p_notes: input.notes ?? null,
  });
  if (error) throwRpc(error);
}

export async function cancelMeeting(password: string, id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("dashboard_cancel_meeting", {
    p_password: password,
    p_id: id,
  });
  if (error) throwRpc(error);
}

export function bdrTone(bdrId: BdrId) {
  return bdrId === "bdr1" ? "bdr-one" : "bdr-two";
}