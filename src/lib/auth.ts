import type { BdrId, DashboardRole } from "./types";

export const ADMIN_PASSWORD = "0505";
export const STORAGE_KEY = "pluss-admin";

export const BDR_LABEL: Record<BdrId, string> = {
  bdr1: "BDR 1",
  bdr2: "BDR 2",
};

export type DashboardAccount = {
  password: string;
  role: DashboardRole;
  label: string;
};

export const ACCOUNTS: DashboardAccount[] = [
  { password: ADMIN_PASSWORD, role: "admin", label: "Owner" },
  { password: "1515", role: "bdr1", label: "BDR 1" },
  { password: "2525", role: "bdr2", label: "BDR 2" },
];

export function resolveAccount(password: string): DashboardAccount | null {
  return ACCOUNTS.find((account) => account.password === password) ?? null;
}

export function isBdr(role: DashboardRole | undefined): role is BdrId {
  return role === "bdr1" || role === "bdr2";
}

export function deletePhrase(fullName: string) {
  return `DELETE ${fullName.trim()}`;
}