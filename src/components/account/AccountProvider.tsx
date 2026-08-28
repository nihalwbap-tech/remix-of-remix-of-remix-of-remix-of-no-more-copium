import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AppAccount,
  readLocalAccounts,
  readActiveAccountId,
  readActiveAccountSnapshot,
  storeActiveAccountId,
  storeActiveAccountSnapshot,
  registerClientAccount,
  authenticateUser,
  resetLocalAccounts,
  COACH_HAL_MASTER_ACCOUNT,
} from "@/lib/cloud-accounts";
import { hydrateCloudCache } from "@/lib/cloud-cache";
import { hydratePaymentSettings } from "@/lib/payment-settings";

type AccountContextValue = {
  account: AppAccount | null;
  accounts: AppAccount[];
  loading: boolean;
  configured: boolean;
  registerClient: (input: {
    accessCode: string;
    name: string;
    username: string;
    password: string;
  }) => Promise<AppAccount>;
  loginUser: (input: { username: string; password: string }) => Promise<AppAccount>;
  loginCoach: (password: string) => Promise<AppAccount>;
  login: (account: AppAccount) => void;
  refresh: () => Promise<void>;
  switchAccount: (account: AppAccount) => void;
  resetToDefaults: () => void;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  // Synchronous 0ms snapshot hydration prevents FOUC and false logouts on page refresh
  const [account, setAccount] = useState<AppAccount | null>(() => readActiveAccountSnapshot());
  const [accounts, setAccounts] = useState<AppAccount[]>(() => readLocalAccounts());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const activeId = readActiveAccountId();

      // Immediate Coach Hal resolution
      if (activeId === "coach-hal-master") {
        setAccount(COACH_HAL_MASTER_ACCOUNT);
        storeActiveAccountSnapshot(COACH_HAL_MASTER_ACCOUNT);
      }

      const all = readLocalAccounts();
      setAccounts(all);

      if (activeId && activeId !== "coach-hal-master") {
        const found = all.find((acc) => acc.id === activeId);
        if (found) {
          setAccount(found);
          storeActiveAccountSnapshot(found);
        }
      }

      // Background cloud hydration
      try {
        await hydrateCloudCache();
        await hydratePaymentSettings();
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback((next: AppAccount) => {
    storeActiveAccountId(next.id);
    storeActiveAccountSnapshot(next);
    setAccount(next);
    setAccounts(readLocalAccounts());
    try {
      void hydrateCloudCache();
      void hydratePaymentSettings();
    } catch {}
  }, []);

  const registerClient = useCallback(
    async (input: {
      accessCode: string;
      name: string;
      username: string;
      password: string;
    }): Promise<AppAccount> => {
      const created = await registerClientAccount(input);
      login(created);
      return created;
    },
    [login],
  );

  const loginUser = useCallback(
    async (input: { username: string; password: string }): Promise<AppAccount> => {
      const authenticated = await authenticateUser(input);
      login(authenticated);
      return authenticated;
    },
    [login],
  );

  const loginCoach = useCallback(
    async (password: string): Promise<AppAccount> => {
      return loginUser({ username: "coach", password });
    },
    [loginUser],
  );

  const resetToDefaults = useCallback(() => {
    const defaults = resetLocalAccounts();
    setAccounts(defaults);
    setAccount(null);
  }, []);

  const signOut = useCallback(async () => {
    storeActiveAccountId(null);
    storeActiveAccountSnapshot(null);
    setAccount(null);
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      account,
      accounts,
      loading,
      configured: true,
      registerClient,
      loginUser,
      loginCoach,
      login,
      refresh,
      switchAccount: login,
      resetToDefaults,
      signOut,
    }),
    [
      account,
      accounts,
      loading,
      registerClient,
      loginUser,
      loginCoach,
      login,
      refresh,
      resetToDefaults,
      signOut,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
