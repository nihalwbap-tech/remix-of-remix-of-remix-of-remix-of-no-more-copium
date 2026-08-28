import { LOCAL_CHAT_CHANGED_EVENT, emitLocalEvent } from "./local-events";
import { supabaseLoose } from "./supabase-loose-client";

export type AccountRole = "coach" | "client" | "payment_manager";

export type AppAccount = {
  id: string;
  name: string;
  username: string;
  role: AccountRole;
  password?: string;
  isPreview: boolean;
  onboardingStep: number;
  onboardingCompletedAt?: string;
  approvedAt?: string;
  assignedProgramId?: string;
  createdAt: string;
};

export const ACTIVE_ACCOUNT_STORAGE_KEY = "no-more-copium:active-account:v3";
export const ACTIVE_ACCOUNT_SNAPSHOT_KEY = "no-more-copium:active-account-snapshot:v3";
export const LOCAL_ACCOUNTS_STORAGE_KEY = "no-more-copium:accounts:v3";
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const COACH_HAL_MASTER_ACCOUNT: AppAccount = {
  id: "coach-hal-master",
  name: "Hal",
  username: "coach",
  role: "coach",
  password: "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD",
  isPreview: false,
  onboardingStep: 0,
  approvedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export const DEFAULT_PROTOTYPE_ACCOUNTS: AppAccount[] = [COACH_HAL_MASTER_ACCOUNT];

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function usernameKey(value: string): string {
  return normalizeUsername(value);
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

export function validateName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "Enter your name.";
  if (name.length > 80) return "Your name must be 80 characters or less.";
  return null;
}

export function readLocalAccounts(): AppAccount[] {
  if (typeof window === "undefined") return DEFAULT_PROTOTYPE_ACCOUNTS;
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      writeLocalAccounts(DEFAULT_PROTOTYPE_ACCOUNTS);
      return DEFAULT_PROTOTYPE_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeLocalAccounts(DEFAULT_PROTOTYPE_ACCOUNTS);
      return DEFAULT_PROTOTYPE_ACCOUNTS;
    }
    const list = parsed as AppAccount[];
    if (!list.some((a) => a.username.toLowerCase() === "coach")) {
      list.unshift(COACH_HAL_MASTER_ACCOUNT);
      writeLocalAccounts(list);
    }
    return list;
  } catch {
    return DEFAULT_PROTOTYPE_ACCOUNTS;
  }
}

export function writeLocalAccounts(accounts: AppAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    const safeList = [...accounts];
    if (!safeList.some((a) => a.username.toLowerCase() === "coach")) {
      safeList.unshift(COACH_HAL_MASTER_ACCOUNT);
    }
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(safeList));
    emitLocalEvent(LOCAL_CHAT_CHANGED_EVENT);
  } catch (err) {
    console.error("Could not write local accounts", err);
  }
}

export function resetLocalAccounts(): AppAccount[] {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_SNAPSHOT_KEY);
  }
  writeLocalAccounts(DEFAULT_PROTOTYPE_ACCOUNTS);
  return DEFAULT_PROTOTYPE_ACCOUNTS;
}

export async function fetchAccount(accountId: string): Promise<AppAccount | null> {
  if (accountId === "coach-hal-master" || accountId === COACH_HAL_MASTER_ACCOUNT.id) {
    return COACH_HAL_MASTER_ACCOUNT;
  }
  const accounts = await fetchAccounts();
  return accounts.find((acc) => acc.id === accountId) ?? null;
}

/** Sync client account to Supabase so Coach Hal sees it across all devices */
export async function syncClientAccountToCloud(account: AppAccount): Promise<void> {
  const validId = account.id && account.id.includes("-") ? account.id : generateUUID();

  // 1. Try Calling SECURITY DEFINER RPC first
  try {
    const { data: rpcRes, error: rpcErr } = await supabaseLoose.rpc("register_client_account_v1", {
      p_id: validId,
      p_name: account.name,
      p_username: account.username.toLowerCase(),
      p_password: account.password || "password123",
      p_access_code: "NMC-DIRECT-SYNC",
    });
    if (!rpcErr && rpcRes) {
      console.log("Registered client via RPC:", rpcRes);
    }
  } catch (err) {
    console.warn("RPC register_client_account_v1 notice:", err);
  }

  // 2. Direct upsert into app_accounts
  try {
    await supabaseLoose.from("app_accounts").upsert({
      id: validId,
      name: account.name,
      username: account.username.toLowerCase(),
      role: "client",
      is_preview: false,
      approved_at: account.approvedAt || new Date().toISOString(),
      created_at: account.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Direct app_accounts upsert notice:", err);
  }

  // 3. Store in cloud accounts vault
  try {
    const { data: stateRow } = await supabaseLoose
      .from("app_state")
      .select("programs")
      .eq("id", "cloud_accounts_vault")
      .maybeSingle();

    const existing: AppAccount[] = Array.isArray(stateRow?.programs) ? (stateRow.programs as AppAccount[]) : [];
    const updated = [
      ...existing.filter((a) => a.username.toLowerCase() !== account.username.toLowerCase()),
      { ...account, id: validId },
    ];

    await supabaseLoose.from("app_state").upsert({
      id: "cloud_accounts_vault",
      programs: updated as unknown as unknown[],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("cloud_accounts_vault upsert notice:", err);
  }
}

/** Fetch all registered clients from cloud + local */
export async function fetchAccounts(): Promise<AppAccount[]> {
  const localList = readLocalAccounts();
  const accountsMap = new Map<string, AppAccount>();

  // Always seed Coach Hal
  accountsMap.set("coach", COACH_HAL_MASTER_ACCOUNT);

  // 1. Fetch from Security Definer RPC
  try {
    const { data: rpcData, error: rpcErr } = await supabaseLoose.rpc("get_all_client_accounts_v1");
    if (!rpcErr && Array.isArray(rpcData)) {
      for (const item of rpcData as Array<Record<string, unknown>>) {
        if (item.username) {
          const userKey = String(item.username).toLowerCase();
          accountsMap.set(userKey, {
            id: String(item.id || generateUUID()),
            name: String(item.name || item.username),
            username: userKey,
            role: "client",
            password: "(Protected)",
            isPreview: false,
            onboardingStep: 5,
            approvedAt: String(item.approvedAt || new Date().toISOString()),
            assignedProgramId: item.assignedProgramId ? String(item.assignedProgramId) : undefined,
            createdAt: String(item.createdAt || new Date().toISOString()),
          });
        }
      }
    }
  } catch {}

  // 2. Fetch from cloud_accounts_vault
  try {
    const { data: vaultRow } = await supabaseLoose
      .from("app_state")
      .select("programs")
      .eq("id", "cloud_accounts_vault")
      .maybeSingle();

    if (vaultRow && Array.isArray(vaultRow.programs)) {
      for (const v of vaultRow.programs as AppAccount[]) {
        if (v.username) {
          const userKey = v.username.toLowerCase();
          const existing = accountsMap.get(userKey);
          accountsMap.set(userKey, {
            ...v,
            id: v.id || existing?.id || generateUUID(),
            username: userKey,
            password: v.password || existing?.password || "(No password)",
          });
        }
      }
    }
  } catch {}

  // 3. Fetch from app_accounts table
  try {
    const { data: dbRows } = await supabaseLoose
      .from("app_accounts")
      .select("id, name, username, role, is_preview, onboarding_step, onboarding_completed_at, approved_at, assigned_program_id, created_at")
      .order("created_at", { ascending: false });

    if (Array.isArray(dbRows)) {
      for (const r of dbRows) {
        if (r.username && String(r.username).toLowerCase() !== "coach") {
          const userKey = String(r.username).toLowerCase();
          const existing = accountsMap.get(userKey);
          accountsMap.set(userKey, {
            id: String(r.id),
            name: String(r.name ?? r.username),
            username: userKey,
            role: (r.role as AccountRole) ?? "client",
            password: existing?.password || "(Protected)",
            isPreview: Boolean(r.is_preview),
            onboardingStep: typeof r.onboarding_step === "number" ? r.onboarding_step : 5,
            onboardingCompletedAt: typeof r.onboarding_completed_at === "string" ? r.onboarding_completed_at : undefined,
            approvedAt: typeof r.approved_at === "string" ? r.approved_at : new Date().toISOString(),
            assignedProgramId: typeof r.assigned_program_id === "string" ? r.assigned_program_id : undefined,
            createdAt: String(r.created_at ?? new Date().toISOString()),
          });
        }
      }
    }
  } catch {}

  // 4. Merge local accounts
  for (const l of localList) {
    if (l.username) {
      const userKey = l.username.toLowerCase();
      if (!accountsMap.has(userKey)) {
        accountsMap.set(userKey, l);
      } else {
        const current = accountsMap.get(userKey)!;
        if (l.password && l.password !== "(Protected)" && l.password !== "(No password)") {
          accountsMap.set(userKey, { ...current, password: l.password });
        }
      }
    }
  }

  const combinedList = Array.from(accountsMap.values());
  writeLocalAccounts(combinedList);
  return combinedList;
}

export async function fetchPublicCoachAccount(): Promise<AppAccount | null> {
  return COACH_HAL_MASTER_ACCOUNT;
}

export class NoAccountError extends Error {
  readonly code = "no_account";
  constructor(message = "No account has been created. Create an account first.") {
    super(message);
    this.name = "NoAccountError";
  }
}

export async function bootstrapAccount(): Promise<AppAccount> {
  const activeId = readActiveAccountId();
  if (activeId === "coach-hal-master" || activeId === COACH_HAL_MASTER_ACCOUNT.id) {
    return COACH_HAL_MASTER_ACCOUNT;
  }

  const snapshot = readActiveAccountSnapshot();
  if (snapshot && snapshot.id === activeId) return snapshot;

  const accounts = await fetchAccounts();
  if (activeId) {
    const found = accounts.find((acc) => acc.id === activeId);
    if (found) {
      storeActiveAccountSnapshot(found);
      return found;
    }
  }
  throw new Error("Sign in first.");
}

export async function registerClientAccount(input: {
  accessCode: string;
  name: string;
  username: string;
  password: string;
}): Promise<AppAccount> {
  const accounts = await fetchAccounts();
  const normUser = normalizeUsername(input.username);

  const nErr = validateName(input.name);
  if (nErr) throw new Error(nErr);
  const uErr = validateUsername(normUser);
  if (uErr) throw new Error(uErr);

  if (!input.password.trim()) {
    throw new Error("Please create a password for your account.");
  }

  if (accounts.some((acc) => acc.username.toLowerCase() === normUser)) {
    throw new Error("That username is already taken. Please choose another username.");
  }

  try {
    const { redeemAccessCode } = await import("./access-codes");
    await redeemAccessCode(input.accessCode.trim());
  } catch {}

  const newAccount: AppAccount = {
    id: generateUUID(),
    name: input.name.trim().replace(/\s+/g, " "),
    username: normUser,
    password: input.password.trim(),
    role: "client",
    isPreview: false,
    onboardingStep: 5,
    onboardingCompletedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const nextList = [...accounts.filter((a) => a.username.toLowerCase() !== normUser), newAccount];
  writeLocalAccounts(nextList);
  storeActiveAccountId(newAccount.id);
  storeActiveAccountSnapshot(newAccount);

  await syncClientAccountToCloud(newAccount);

  return newAccount;
}

export async function authenticateUser(input: {
  username: string;
  password: string;
}): Promise<AppAccount> {
  const cleanUser = input.username.toLowerCase().trim();
  const cleanPass = input.password.trim();

  if (cleanPass === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD" || cleanUser === "coach") {
    if (cleanPass === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD") {
      storeActiveAccountId(COACH_HAL_MASTER_ACCOUNT.id);
      storeActiveAccountSnapshot(COACH_HAL_MASTER_ACCOUNT);
      return COACH_HAL_MASTER_ACCOUNT;
    }
  }

  const accounts = await fetchAccounts();
  const found = accounts.find((acc) => acc.username.toLowerCase() === cleanUser);

  if (!found) {
    throw new Error(`No account found with username @${cleanUser}. Please check the spelling or create an account with your access code.`);
  }

  if (found.password && found.password !== "(Protected)" && found.password !== cleanPass) {
    throw new Error("Incorrect password. Please try again or ask Coach Hal to look up your password.");
  }

  storeActiveAccountId(found.id);
  storeActiveAccountSnapshot(found);
  return found;
}

/** Manual link helper for Coach Hal to manually link any client like Jatin (@Jatinkumar13) */
export async function manuallyLinkClient(input: {
  username: string;
  name?: string;
  password?: string;
}): Promise<AppAccount> {
  const normUser = normalizeUsername(input.username);
  const accounts = await fetchAccounts();
  const existing = accounts.find((a) => a.username.toLowerCase() === normUser);

  if (existing) {
    return existing;
  }

  const newAccount: AppAccount = {
    id: generateUUID(),
    name: input.name?.trim() || input.username.trim(),
    username: normUser,
    password: input.password?.trim() || "client123",
    role: "client",
    isPreview: false,
    onboardingStep: 5,
    onboardingCompletedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const nextList = [...accounts, newAccount];
  writeLocalAccounts(nextList);
  await syncClientAccountToCloud(newAccount);
  return newAccount;
}

export async function createAccount(input: {
  name: string;
  username: string;
  role: AccountRole;
  password?: string;
}): Promise<AppAccount> {
  const accounts = await fetchAccounts();
  const normUser = normalizeUsername(input.username);
  const newAccount: AppAccount = {
    id: generateUUID(),
    name: input.name.trim(),
    username: normUser,
    password: input.password || "password123",
    role: input.role,
    isPreview: false,
    onboardingStep: 5,
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  writeLocalAccounts([...accounts, newAccount]);
  storeActiveAccountId(newAccount.id);
  storeActiveAccountSnapshot(newAccount);
  void syncClientAccountToCloud(newAccount);
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
      "onboardingStep" | "onboardingCompletedAt" | "assignedProgramId" | "approvedAt" | "name" | "password"
    >
  >,
): Promise<AppAccount> {
  const accounts = await fetchAccounts();
  const index = accounts.findIndex((acc) => acc.id === accountId);
  if (index === -1) {
    throw new Error("Account not found.");
  }
  const updated: AppAccount = {
    ...accounts[index],
    ...updates,
  };
  accounts[index] = updated;
  writeLocalAccounts(accounts);
  storeActiveAccountSnapshot(updated);
  void syncClientAccountToCloud(updated);
  return updated;
}

export function readActiveAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}

export function readActiveAccountSnapshot(): AppAccount | null {
  if (typeof window === "undefined") return null;
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
  if (!activeId) return null;
  if (activeId === "coach-hal-master" || activeId === COACH_HAL_MASTER_ACCOUNT.id) {
    return COACH_HAL_MASTER_ACCOUNT;
  }

  try {
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_SNAPSHOT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppAccount;
      if (parsed && parsed.id === activeId) return parsed;
    }
  } catch {}

  const local = readLocalAccounts();
  const found = local.find((a) => a.id === activeId);
  if (found) {
    storeActiveAccountSnapshot(found);
    return found;
  }

  return null;
}

export function storeActiveAccountSnapshot(account: AppAccount | null): void {
  if (typeof window === "undefined") return;
  try {
    if (account) {
      localStorage.setItem(ACTIVE_ACCOUNT_SNAPSHOT_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(ACTIVE_ACCOUNT_SNAPSHOT_KEY);
    }
  } catch {}
}

export function storeActiveAccountId(accountId: string | null): void {
  if (typeof window === "undefined") return;
  if (accountId) {
    localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, accountId);
    if (accountId === "coach-hal-master" || accountId === COACH_HAL_MASTER_ACCOUNT.id) {
      storeActiveAccountSnapshot(COACH_HAL_MASTER_ACCOUNT);
    }
  } else {
    localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_SNAPSHOT_KEY);
  }
}
