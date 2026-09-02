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
  source: string;
  created_at: string;
  updated_at: string;
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
