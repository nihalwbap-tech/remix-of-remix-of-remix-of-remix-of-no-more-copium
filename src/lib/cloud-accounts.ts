import { supabase } from "@/integrations/supabase/client";
import { supabaseLoose } from "./supabase-loose-client";

export type AccountRole = "coach" | "client" | "payment_manager";

export type AppAccount = {
  id: string;
  name: string;
  username: string;
  role: AccountRole;
  isPreview: boolean;
  onboardingStep: number;
  onboardingCompletedAt?: string;
  approvedAt?: string;
  assignedProgramId?: string;
  createdAt: string;
};

export const ACTIVE_ACCOUNT_STORAGE_KEY = "no-more-copium:active-account:v3";
export const LOCAL_ACCOUNTS_STORAGE_KEY = "no-more-copium:accounts:v3";
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export function normalizeUsername(value: string): string {
  return value.trim();
}

export function usernameKey(value: string): string {
  return normalizeUsername(value).toLowerCase();
}

export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value);
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use only lowercase letters (a–z), numbers, and underscores.";
  }
  return null;
}

function mapRow(row: Record<string, unknown>): AppAccount {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    username: String(row.username ?? ""),
    role: (row.role as AccountRole) ?? "client",
    isPreview: Boolean(row.is_preview),
    onboardingStep:
      typeof row.onboarding_step === "number" ? row.onboarding_step : 0,
    onboardingCompletedAt:
      typeof row.onboarding_completed_at === "string"
        ? row.onboarding_completed_at
        : undefined,
    approvedAt:
      typeof row.approved_at === "string" ? row.approved_at : new Date().toISOString(),
    assignedProgramId:
      typeof row.assigned_program_id === "string" ? row.assigned_program_id : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function readLocalAccounts(): AppAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppAccount[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalAccounts(accounts: AppAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

export async function fetchAccount(accountId: string): Promise<AppAccount | null> {
  const localList = readLocalAccounts();
  const foundLocal = localList.find((a) => a.id === accountId);
  if (foundLocal) return foundLocal;

  try {
    const { data, error } = await supabaseLoose
      .from("app_accounts")
      .select(
        "id, name, username, role, is_preview, onboarding_step, onboarding_completed_at, approved_at, assigned_program_id, created_at",
      )
      .eq("id", accountId)
      .maybeSingle();
    if (!error && data) return mapRow(data as Record<string, unknown>);
  } catch {
    // fallback to local
  }
  return null;
}

export async function fetchAccounts(): Promise<AppAccount[]> {
  try {
    const { data: rows, error } = await supabaseLoose
      .from("app_accounts")
      .select(
        "id, name, username, role, is_preview, onboarding_step, onboarding_completed_at, approved_at, assigned_program_id, created_at",
      )
      .order("created_at", { ascending: true });
    if (!error && rows) return rows.map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    // fallback
  }
  return readLocalAccounts();
}

export async function fetchPublicCoachAccount(): Promise<AppAccount | null> {
  return {
    id: "coach-hal-master",
    name: "Hal",
    username: "coach",
    role: "coach",
    isPreview: false,
    onboardingStep: 0,
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export class NoAccountError extends Error {
  readonly code = "no_account";
  constructor(
    message = "No account has been created with this Google account. Create an account first.",
  ) {
    super(message);
    this.name = "NoAccountError";
  }
}

export async function bootstrapAccount(): Promise<AppAccount> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  const activeId = readActiveAccountId();
  const localAccounts = readLocalAccounts();

  // If Supabase session exists
  if (user) {
    try {
      const { data, error } = await supabase.functions.invoke("account-bootstrap", {
        body: {},
      });
      if (!error && data?.ok && data?.account?.id) {
        const full = await fetchAccount(String(data.account.id));
        if (full) {
          storeActiveAccountId(full.id);
          return full;
        }
      }
    } catch {
      // check local store
    }

    const matching = localAccounts.find(
      (a) => a.id === user.id || a.username.toLowerCase() === (user.email?.split("@")[0] || "").toLowerCase()
    );
    if (matching) {
      storeActiveAccountId(matching.id);
      return matching;
    }

    throw new NoAccountError();
  }

  // If coach or offline active account
  if (activeId) {
    const found = localAccounts.find((a) => a.id === activeId);
    if (found) return found;
    if (activeId === "coach-hal-master") {
      return {
        id: "coach-hal-master",
        name: "Hal",
        username: "coach",
        role: "coach",
        isPreview: false,
        onboardingStep: 0,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  }

  throw new Error("Sign in first.");
}

export async function createAccount(input: {
  name: string;
  username: string;
  role: AccountRole;
}): Promise<AppAccount> {
  const newAccount: AppAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    username: input.username.toLowerCase(),
    role: input.role,
    isPreview: false,
    onboardingStep: 5,
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const list = readLocalAccounts();
  writeLocalAccounts([...list, newAccount]);
  storeActiveAccountId(newAccount.id);
  return newAccount;
}

export async function updateCloudClientAssignment(
  clientId: string,
  assignedProgramId: string | undefined,
): Promise<AppAccount> {
  return updateLocalAccount(clientId, { assignedProgramId });
}

export async function updateLocalAccount(
  accountId: string,
  updates: Partial<
    Pick<
      AppAccount,
      "onboardingStep" | "onboardingCompletedAt" | "assignedProgramId" | "approvedAt" | "name"
    >
  >,
): Promise<AppAccount> {
  const localList = readLocalAccounts();
  const idx = localList.findIndex((a) => a.id === accountId);
  if (idx !== -1) {
    localList[idx] = { ...localList[idx], ...updates };
    writeLocalAccounts(localList);
    return localList[idx];
  }
  const fallback: AppAccount = {
    id: accountId,
    name: "Lifter",
    username: "lifter",
    role: "client",
    isPreview: false,
    onboardingStep: 5,
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...updates,
  };
  writeLocalAccounts([...localList, fallback]);
  return fallback;
}

export function readActiveAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}

export function storeActiveAccountId(accountId: string | null): void {
  if (typeof window === "undefined") return;
  if (accountId) window.localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, accountId);
  else window.localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}
