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
  storeActiveAccountId,
  registerClientAccount,
  authenticateUser,
  resetLocalAccounts,
} from "@/lib/cloud-accounts";
import { hydrateCloudCache } from "@/lib/cloud-cache";
import { hydratePaymentSettings } from "@/lib/payment-settings";

type AccountContextValue = {
  account: AppAccount | null;
  accounts: AppAccount[];
  loading: boolean;
  configured: boolean;
  registerClient: (input: { accessCode: string; name: string; username: string; password: string }) => Promise<AppAccount>;
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
  const [account, setAccount] = useState<AppAccount | null>(null);
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const all = readLocalAccounts();
      setAccounts(all);
      const activeId = readActiveAccountId();
      const active = all.find((acc) => acc.id === activeId) ?? null;
      setAccount(active);
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
    setAccount(next);
    setAccounts(readLocalAccounts());
    try {
      void hydrateCloudCache();
      void hydratePaymentSettings();
    } catch {}
  }, []);

  const registerClient = useCallback(
    async (input: { accessCode: string; name: string; username: string; password: string }): Promise<AppAccount> => {
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
