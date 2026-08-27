import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/config";
import {
  type AppAccount,
  NoAccountError,
  bootstrapAccount,
} from "@/lib/cloud-accounts";
import { createClientAccount, loginCoach as loginCoachRequest } from "@/lib/access-codes";
import { hydrateCloudCache } from "@/lib/cloud-cache";
import { hydratePaymentSettings } from "@/lib/payment-settings";

type AccountContextValue = {
  account: AppAccount | null;
  accounts: AppAccount[];
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  completeAccessCodeAccount: (name: string, username: string, ticket: string) => Promise<AppAccount>;
  loginCoach: (password: string) => Promise<AppAccount>;
  login: (account: AppAccount) => void;
  refresh: () => Promise<void>;
  switchAccount: (account: AppAccount) => void;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AppAccount | null>(null);
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const refresh = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session?.data?.session) {
        setAccounts([]);
        setAccount(null);
        setLoading(false);
        return;
      }
      const next = await bootstrapAccount();
      await hydrateCloudCache().catch(() => undefined);
      await hydratePaymentSettings().catch(() => undefined);
      setAccount(next);
      setAccounts([next]);
    } catch (error) {
      if (error instanceof NoAccountError) {
        console.warn("Signed-in identity has no app account yet:", error.message);
      } else {
        console.warn("Account session check:", error);
      }
      setAccount(null);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    void refresh();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void refresh();
      } else if (event === "SIGNED_OUT") {
        setAccount(null);
        setAccounts([]);
        setLoading(false);
      }
    });
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [configured, refresh]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/access` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) throw error;
  }, []);

  const completeAccessCodeAccount = useCallback(
    async (name: string, username: string, ticket: string): Promise<AppAccount> => {
      const next = await createClientAccount({ name, username, ticket });
      setAccount(next);
      setAccounts([next]);
      return next;
    },
    [],
  );

  const loginCoach = useCallback(
    async (password: string): Promise<AppAccount> => {
      const result = await loginCoachRequest(password);
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
      setAccount(result.account);
      setAccounts([result.account]);
      try {
        await hydrateCloudCache();
        await hydratePaymentSettings();
      } catch {}
      return result.account;
    },
    [],
  );

  const login = useCallback((next: AppAccount) => {
    setAccount(next);
    setAccounts([next]);
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      account,
      accounts,
      loading,
      configured,
      signInWithGoogle,
      completeAccessCodeAccount,
      loginCoach,
      login,
      refresh,
      switchAccount: login,
      signOut: async () => {
        await supabase.auth.signOut();
        setAccount(null);
        setAccounts([]);
      },
    }),
    [
      account,
      accounts,
      loading,
      configured,
      signInWithGoogle,
      completeAccessCodeAccount,
      loginCoach,
      login,
      refresh,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
