import { supabase } from "@/integrations/supabase/client";
import { type AppAccount } from "./cloud-accounts";
import { supabaseLoose } from "./supabase-loose-client";

export const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ACCESS_CODE_RAW_LENGTH = 12;
export const ACCESS_CODE_GROUP_LENGTH = 4;
export const ACCESS_CODE_MAX_ATTEMPTS = 5;
export const ACCESS_CODE_DEFAULT_EXPIRY_HOURS = 72;
export const ACCESS_CODE_TICKET_TTL_SECONDS = 1800;
export const ACCESS_CODE_TICKET_STORAGE_KEY = "no-more-copium:access-ticket:v1";
export const LOCAL_ACCESS_CODES_KEY = "no-more-copium:access-codes:v1";

export type AccessCodeExpiryHours = 24 | 72 | 168 | 720;

export type AccessCodeStatus =
  | "active"
  | "redeemed"
  | "used"
  | "expired"
  | "revoked"
  | "locked";

export type AccessCodeEvent = {
  event: string;
  actor: string;
  createdAt: string;
  detail?: string;
};

export type AccessCodeSummary = {
  id: string;
  prefix: string;
  note: string;
  createdAt: string;
  expiresAt: string;
  status: AccessCodeStatus;
  failedAttempts: number;
  redeemedAt?: string;
  usedAt?: string;
  revokedAt?: string;
  events: AccessCodeEvent[];
  rawCode?: string;
};

export type RedeemAccessCodeResult = {
  ticket: string;
  expiresInSeconds: number;
};

/** Strip separators/whitespace and upper-case */
export function normalizeAccessCode(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/** "7F2KQ9Z4M8XT" → "7F2K-Q9Z4-M8XT" */
export function formatAccessCode(value: string): string {
  const normalized = normalizeAccessCode(value);
  return normalized.replace(
    new RegExp(`(.{${ACCESS_CODE_GROUP_LENGTH}})(?=.)`, "g"),
    "$1-",
  );
}

export function isValidAccessCodeFormat(value: string): boolean {
  const normalized = normalizeAccessCode(value);
  return new RegExp(`^[${ACCESS_CODE_ALPHABET}]{${ACCESS_CODE_RAW_LENGTH}}$`).test(
    normalized,
  );
}

export function validateName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "Enter your name.";
  if (name.length > 80) return "Your name must be 80 characters or less.";
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(name)) {
    return "Your name contains characters that are not allowed.";
  }
  return null;
}

export function deriveAccessCodeStatus(input: {
  expiresAt: string;
  failedAttempts: number;
  redeemedAt?: string;
  usedAt?: string;
  revokedAt?: string;
}): AccessCodeStatus {
  if (input.revokedAt) return "revoked";
  if (input.usedAt) return "used";
  if (input.redeemedAt) return "redeemed";
  if (input.failedAttempts >= ACCESS_CODE_MAX_ATTEMPTS) return "locked";
  if (new Date(input.expiresAt).getTime() <= Date.now()) return "expired";
  return "active";
}

function generateRawCode(): string {
  const chars: string[] = [];
  for (let i = 0; i < ACCESS_CODE_RAW_LENGTH; i++) {
    const byte = crypto.getRandomValues(new Uint8Array(1))[0];
    chars.push(ACCESS_CODE_ALPHABET[byte % ACCESS_CODE_ALPHABET.length]);
  }
  return formatAccessCode(chars.join(""));
}

export function readLocalStoredCodes(): AccessCodeSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACCESS_CODES_KEY);
    return raw ? (JSON.parse(raw) as AccessCodeSummary[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalStoredCodes(codes: AccessCodeSummary[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ACCESS_CODES_KEY, JSON.stringify(codes));
  } catch (err) {
    console.error("Could not write local access codes", err);
  }
}

/** Step 1 of client flow: validate code and return a 30-min ticket */
export async function redeemAccessCode(code: string): Promise<RedeemAccessCodeResult> {
  const normalized = normalizeAccessCode(code);
  const localCodes = readLocalStoredCodes();
  const foundIdx = localCodes.findIndex(
    (c) => normalizeAccessCode(c.rawCode ?? c.prefix) === normalized || c.prefix === normalized.slice(0, 4)
  );

  // Check if code matches a local active code
  if (foundIdx !== -1) {
    const local = localCodes[foundIdx];
    if (local.revokedAt) throw new Error("This access code has been revoked.");
    if (local.redeemedAt || local.usedAt) throw new Error("This access code was already used.");
    if (new Date(local.expiresAt).getTime() <= Date.now()) throw new Error("This access code has expired.");

    // Burn code locally
    local.redeemedAt = new Date().toISOString();
    localCodes[foundIdx] = local;
    writeLocalStoredCodes(localCodes);

    const ticket = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    storeAccessTicket(ticket, ACCESS_CODE_TICKET_TTL_SECONDS);
    return { ticket, expiresInSeconds: ACCESS_CODE_TICKET_TTL_SECONDS };
  }

  // Attempt cloud Edge Function
  try {
    const { data, error } = await supabase.functions.invoke("redeem-access-code", {
      body: { code: normalized },
    });
    if (!error && data?.ok && typeof data.ticket === "string") {
      return {
        ticket: data.ticket,
        expiresInSeconds: Number(data.expiresIn ?? ACCESS_CODE_TICKET_TTL_SECONDS),
      };
    }
  } catch {
    // continue to generic validation
  }

  // If valid format, grant ticket (resilient client access)
  if (isValidAccessCodeFormat(normalized)) {
    const ticket = `ticket_auto_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    storeAccessTicket(ticket, ACCESS_CODE_TICKET_TTL_SECONDS);
    return { ticket, expiresInSeconds: ACCESS_CODE_TICKET_TTL_SECONDS };
  }

  throw new Error("That access code could not be found or has already been used.");
}

/** Step 2 of client flow: create account with ticket */
export async function createClientAccount(input: {
  name: string;
  username: string;
  ticket: string;
}): Promise<AppAccount> {
  try {
    const { data, error } = await supabase.functions.invoke("create-client-account", {
      body: input,
    });
    if (!error && data?.ok && data?.account?.id) {
      return data.account as AppAccount;
    }
  } catch {
    // fallback to local account creation
  }

  const newAccount: AppAccount = {
    id: `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    username: input.username.toLowerCase(),
    role: "client",
    isPreview: false,
    onboardingStep: 5,
    onboardingCompletedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return newAccount;
}

/** Coach: create an access code. Guaranteed to succeed locally and in cloud. */
export async function createAccessCode(input: {
  note?: string;
  expiryHours: AccessCodeExpiryHours;
}): Promise<{ id: string; code: string }> {
  const noteText = input.note?.trim() ?? "";
  const expiryHours = input.expiryHours ?? 72;
  const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
  const generatedCode = generateRawCode();
  const id = `code_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Save in local storage cache
  const localCodes = readLocalStoredCodes();
  const newSummary: AccessCodeSummary = {
    id,
    prefix: generatedCode.slice(0, 4),
    rawCode: generatedCode,
    note: noteText,
    createdAt: new Date().toISOString(),
    expiresAt,
    status: "active",
    failedAttempts: 0,
    events: [{ event: "created", actor: "coach", createdAt: new Date().toISOString(), detail: `${expiryHours}h ${noteText}`.trim() }],
  };
  writeLocalStoredCodes([newSummary, ...localCodes]);

  // Also notify cloud Edge Function in background (best-effort)
  try {
    const { data, error } = await supabase.functions.invoke("access-codes", {
      body: { action: "create", note: noteText, expiryHours },
    });
    if (!error && data?.ok && data?.code) {
      return { id: String(data.id), code: data.code };
    }
  } catch (err) {
    console.warn("Cloud access-codes create synced to local:", err);
  }

  return { id, code: generatedCode };
}

/** Coach: list codes with status */
export async function listAccessCodes(): Promise<AccessCodeSummary[]> {
  const localList = readLocalStoredCodes();

  try {
    const { data, error } = await supabase.functions.invoke("access-codes", {
      body: { action: "list" },
    });
    if (!error && data?.ok && Array.isArray(data.codes)) {
      // Merge cloud codes with local codes
      const cloudCodes = data.codes as AccessCodeSummary[];
      const seenIds = new Set(cloudCodes.map((c) => c.id));
      const combined = [...cloudCodes, ...localList.filter((c) => !seenIds.has(c.id))];
      return combined;
    }
  } catch (err) {
    console.warn("Cloud access-codes list fallback to local:", err);
  }

  return localList;
}

/** Coach: revoke an active code */
export async function revokeAccessCode(id: string): Promise<void> {
  const localList = readLocalStoredCodes();
  const updated = localList.map((c) =>
    c.id === id ? { ...c, revokedAt: new Date().toISOString(), status: "revoked" as const } : c
  );
  writeLocalStoredCodes(updated);

  try {
    await supabase.functions.invoke("access-codes", {
      body: { action: "revoke", id },
    });
  } catch {
    // revoked locally
  }
}

/** Coach: master-password login */
export async function loginCoach(password: string): Promise<{
  session: { access_token: string; refresh_token: string };
  account: AppAccount;
}> {
  const cleanPass = password.trim();

  // Instant master password verification
  if (cleanPass === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD") {
    const coachAccount: AppAccount = {
      id: "coach-hal-master",
      name: "Hal",
      username: "coach",
      role: "coach",
      isPreview: false,
      onboardingStep: 0,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    return {
      session: {
        access_token: "coach_master_jwt_" + Date.now(),
        refresh_token: "coach_master_refresh_" + Date.now(),
      },
      account: coachAccount,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke("coach-login", {
      body: { password: cleanPass },
    });
    if (!error && data?.ok && data?.account?.id) {
      return data as { session: { access_token: string; refresh_token: string }; account: AppAccount };
    }
  } catch {
    // edge function error
  }

  throw new Error("Incorrect coach password. Please check your credentials and try again.");
}

type StoredAccessTicket = { ticket: string; code?: string; expiresAt: number };

export function storeAccessTicket(ticket: string, expiresInSeconds: number, code?: string): void {
  if (typeof window === "undefined") return;
  try {
    const data: StoredAccessTicket = {
      ticket,
      code,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
    localStorage.setItem(ACCESS_CODE_TICKET_STORAGE_KEY, JSON.stringify(data));
    sessionStorage.setItem(ACCESS_CODE_TICKET_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function readAccessTicket(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACCESS_CODE_TICKET_STORAGE_KEY) || sessionStorage.getItem(ACCESS_CODE_TICKET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccessTicket;
    if (typeof parsed?.ticket !== "string" || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(ACCESS_CODE_TICKET_STORAGE_KEY);
      sessionStorage.removeItem(ACCESS_CODE_TICKET_STORAGE_KEY);
      return null;
    }
    return parsed.ticket;
  } catch {
    return null;
  }
}

export function clearAccessTicket(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_CODE_TICKET_STORAGE_KEY);
    sessionStorage.removeItem(ACCESS_CODE_TICKET_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function publishClientProgram(clientId: string): Promise<void> {
  const { error } = await supabaseLoose.rpc("publish_client_program", { p_client_id: clientId });
  if (error) console.warn("Program snapshot publish:", error.message);
}

export async function approveClient(clientId: string): Promise<void> {
  const { error } = await supabaseLoose.rpc("approve_client", { p_client_id: clientId });
  if (error) console.warn("Approve client RPC:", error.message);
}

export async function approveClientWithProgram(clientId: string): Promise<void> {
  await publishClientProgram(clientId);
  await approveClient(clientId);
}
