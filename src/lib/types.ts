export const WHATSAPP_NUMBER = "213542452129";
export const CONTACT_EMAIL = "kernoumehdi17@gmail.com";
export const LINKEDIN_URL = "https://www.linkedin.com/in/kernoumehdi";
export const SITE_URL = "https://www.pluss.dev/";
export const PORTFOLIO_URL = "https://www.pluss.dev/";

export const BUSINESS_TYPES = [
  "Shop / Commerce",
  "Agency / Services",
  "Restaurant / Café",
  "Clinic / Professional",
  "Startup",
  "Other",
] as const;

export const LEAD_STATUSES = ["new", "contacted", "booked", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const BDR_IDS = ["bdr1", "bdr2"] as const;
export type BdrId = (typeof BDR_IDS)[number];
export type DashboardRole = "admin" | BdrId;

export type Lead = {
  id: string;
  full_name: string;
  business_name: string;
  phone: string;
  email: string;
  city: string | null;
  business_type: string | null;
  service: string | null;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  assigned_to: BdrId | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type AvailabilityWindow = {
  id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
};

export type Meeting = {
  id: string;
  lead_id: string | null;
  lead_name: string | null;
  bdr_id: BdrId;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  created_at: string;
};

export type LeadInput = {
  full_name: string;
  business_name: string;
  phone: string;
  email: string;
  city: string;
  business_type: string;
  service: string;
  message: string;
};
