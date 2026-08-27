import { LOCAL_CHAT_CHANGED_EVENT, emitLocalEvent } from "./local-events";

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
export const LOCAL_ACCOUNTS_STORAGE_KEY = "no-more-copium:accounts:v3";
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const DEFAULT_PROTOTYPE_ACCOUNTS: AppAccount[] = [
  {
    id: "coach-hal-master",
    name: "Hal",
    username: "coach",
    role: "coach",
    password: "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD",
    isPreview: false,
    onboardingStep: 0,
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "client-bobby",
    name: "Bobby",
    username: "bobby_07",
    role: "client",
    password: "bobby123password",
    isPreview: false,
    onboardingStep: 5,
    onboardingCompletedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    assignedProgramId: "sample-program-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "client-marcus",
    name: "Marcus",
    username: "marcus_fit",
    role: "client",
    password: "marcus123password",
    isPreview: false,
    onboardingStep: 5,
    onboardingCompletedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    assignedProgramId: "sample-program-1",
    createdAt: new Date().toISOString(),
  },
];

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
    return parsed as AppAccount[];
  } catch {
    return DEFAULT_PROTOTYPE_ACCOUNTS;
  }
}

export function writeLocalAccounts(accounts: AppAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    emitLocalEvent(LOCAL_CHAT_CHANGED_EVENT);
  } catch (err) {
    console.error("Could not write local accounts", err);
  }
}

export function resetLocalAccounts(): AppAccount[] {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
  }
  writeLocalAccounts(DEFAULT_PROTOTYPE_ACCOUNTS);
  return DEFAULT_PROTOTYPE_ACCOUNTS;
}

export async function fetchAccount(accountId: string): Promise<AppAccount | null> {
  const accounts = readLocalAccounts();
  return accounts.find((acc) => acc.id === accountId) ?? null;
}

export async function fetchAccounts(): Promise<AppAccount[]> {
  return readLocalAccounts();
}

export async function fetchPublicCoachAccount(): Promise<AppAccount | null> {
  const accounts = readLocalAccounts();
  return accounts.find((acc) => acc.role === "coach") ?? DEFAULT_PROTOTYPE_ACCOUNTS[0];
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
  const accounts = readLocalAccounts();
  if (activeId) {
    const found = accounts.find((acc) => acc.id === activeId);
    if (found) return found;
  }
  throw new Error("Sign in first.");
}

/**
 * Register a client account with an access code voucher, name, username, and password.
 */
export async function registerClientAccount(input: {
  accessCode: string;
  name: string;
  username: string;
  password: string;
}): Promise<AppAccount> {
  const accounts = readLocalAccounts();
  const normUser = normalizeUsername(input.username);

  // Validate Name & Username
  const nErr = validateName(input.name);
  if (nErr) throw new Error(nErr);
  const uErr = validateUsername(normUser);
  if (uErr) throw new Error(uErr);

  if (!input.password.trim()) {
    throw new Error("Please create a password for your account.");
  }

  // Check unique username
  if (accounts.some((acc) => acc.username.toLowerCase() === normUser)) {
    throw new Error("That username is already taken. Please choose another username.");
  }

  // Validate access code
  const { redeemAccessCode } = await import("./access-codes");
  await redeemAccessCode(input.accessCode.trim());

  const newAccount: AppAccount = {
    id: `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

  const nextList = [...accounts, newAccount];
  writeLocalAccounts(nextList);
  storeActiveAccountId(newAccount.id);
  return newAccount;
}

/**
 * Log in with username and password.
 */
export async function authenticateUser(input: {
  username: string;
  password: string;
}): Promise<AppAccount> {
  const cleanUser = input.username.toLowerCase().trim();
  const cleanPass = input.password.trim();

  // Check Coach master credentials
  if (cleanPass === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD" || cleanUser === "coach") {
    if (cleanPass === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD") {
      const coachAccount: AppAccount = {
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
      storeActiveAccountId(coachAccount.id);
      return coachAccount;
    }
  }

  const accounts = readLocalAccounts();
  const found = accounts.find((acc) => acc.username.toLowerCase() === cleanUser);

  if (!found) {
    throw new Error(`No account found with username @${cleanUser}. Please check the spelling or create an account with your access code.`);
  }

  if (found.password && found.password !== cleanPass) {
    throw new Error("Incorrect password. Please try again or ask Coach Hal to look up your password.");
  }

  storeActiveAccountId(found.id);
  return found;
}

export async function createAccount(input: {
  name: string;
  username: string;
  role: AccountRole;
  password?: string;
}): Promise<AppAccount> {
  const accounts = readLocalAccounts();
  const normUser = normalizeUsername(input.username);
  const newAccount: AppAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
  const accounts = readLocalAccounts();
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
  return updated;
}

export function readActiveAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}

export function storeActiveAccountId(accountId: string | null): void {
  if (typeof window === "undefined") return;
  if (accountId) localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, accountId);
  else localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}
