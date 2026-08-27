import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AppAccount, normalizeUsername, validateName, validateUsername } from "@/lib/cloud-accounts";
import { useAccount } from "./AccountProvider";

type AuthTab = "create" | "login" | "coach";

function enterRouteFor(account: AppAccount): string {
  if (account.role === "coach") return "/coach/dashboard";
  if (account.role === "payment_manager") return "/payment/dashboard";
  return "/client/dashboard";
}

export function AccountAccess() {
  const navigate = useNavigate();
  const { registerClient, loginUser, loginCoach } = useAccount();

  const [tab, setTab] = useState<AuthTab>("create");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Create Account Form State
  const [accessCode, setAccessCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Coach Password State
  const [coachPassword, setCoachPassword] = useState("");
  const [showCoachPassword, setShowCoachPassword] = useState(false);

  // Handle Create Account Submit
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Smart Coach Detection: If user pasted coach master password into access code field
    if (
      accessCode.trim() === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD" ||
      password.trim() === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD"
    ) {
      setBusy(true);
      try {
        const coach = await loginCoach("Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD");
        void navigate({ to: enterRouteFor(coach) as never });
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Coach login failed.");
      } finally {
        setBusy(false);
      }
      return;
    }

    const nErr = validateName(name);
    if (nErr) { setError(nErr); return; }
    const uErr = validateUsername(username);
    if (uErr) { setError(uErr); return; }

    if (!accessCode.trim()) {
      setError("Enter your 12-character access code from your coach.");
      return;
    }
    if (!password.trim()) {
      setError("Please create a password for your account.");
      return;
    }

    setBusy(true);
    try {
      const created = await registerClient({
        accessCode: accessCode.trim(),
        name: name.trim(),
        username: normalizeUsername(username),
        password: password.trim(),
      });
      void navigate({ to: enterRouteFor(created) as never });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account creation failed.");
    } finally {
      setBusy(false);
    }
  };

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginUsername.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!loginPassword.trim()) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      const loggedIn = await loginUser({
        username: loginUsername.trim(),
        password: loginPassword.trim(),
      });
      void navigate({ to: enterRouteFor(loggedIn) as never });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  // Handle Coach Login Submit
  const handleCoachLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!coachPassword.trim()) {
      setError("Please enter the coach master password.");
      return;
    }

    setBusy(true);
    try {
      const coach = await loginCoach(coachPassword.trim());
      void navigate({ to: enterRouteFor(coach) as never });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect coach password.");
    } finally {
      setBusy(false);
    }
  };

  if (tab === "coach") {
    return (
      <form onSubmit={handleCoachLogin} className="space-y-4 text-left" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="coach-password">Coach Master Password</Label>
          <div className="relative">
            <Input
              id="coach-password"
              type={showCoachPassword ? "text" : "password"}
              value={coachPassword}
              onChange={(e) => { setCoachPassword(e.target.value); setError(null); }}
              placeholder="Paste coach master password"
              autoFocus
              required
              className="rounded-xl pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowCoachPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showCoachPassword ? "Hide password" : "Show password"}
            >
              {showCoachPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="flex items-start gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Button
          type="submit"
          disabled={busy || !coachPassword.trim()}
          className="min-h-12 w-full rounded-xl bg-primary text-[1rem] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
        >
          {busy ? "Signing in…" : "Sign in as Coach"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => { setTab("create"); setError(null); setCoachPassword(""); }}
          className="min-h-11 w-full rounded-xl text-sm text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to access options
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => { setTab("create"); setError(null); }}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "create"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Create account
        </button>
        <button
          type="button"
          onClick={() => { setTab("login"); setError(null); }}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "login"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LogIn className="h-4 w-4" />
          Log in
        </button>
      </div>

      {/* CREATE ACCOUNT FORM */}
      {tab === "create" && (
        <form onSubmit={handleCreateAccount} className="space-y-4" noValidate>
          {/* 1. Access Code */}
          <div className="space-y-1.5">
            <Label htmlFor="create-access-code">Your access code</Label>
            <div className="relative">
              <Input
                id="create-access-code"
                value={accessCode}
                onChange={(e) => { setAccessCode(e.target.value); setError(null); }}
                placeholder="XXXX-XXXX-XXXX"
                autoFocus
                required
                className="rounded-xl font-mono text-[1rem] pr-10"
              />
              <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[0.75rem] text-muted-foreground">
              Single-use code sent by Coach Hal in your DM.
            </p>
          </div>

          {/* 2. Name */}
          <div className="space-y-1.5">
            <Label htmlFor="create-name">Your name</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="e.g. Bobby"
              maxLength={80}
              required
              className="rounded-xl"
            />
          </div>

          {/* 3. Username */}
          <div className="space-y-1.5">
            <Label htmlFor="create-username">Your username</Label>
            <Input
              id="create-username"
              value={username}
              onChange={(e) => { setUsername(e.target.value.toLowerCase().trim()); setError(null); }}
              placeholder="e.g. bobby_07"
              maxLength={30}
              required
              className="rounded-xl"
            />
            <p className="text-[0.75rem] text-muted-foreground">
              3–30 lowercase letters, numbers, or underscores.
            </p>
          </div>

          {/* 4. Password */}
          <div className="space-y-1.5">
            <Label htmlFor="create-password">Create password</Label>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Choose a password"
                required
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <Button
            type="submit"
            disabled={busy || !accessCode.trim() || !name.trim() || !username.trim() || !password.trim()}
            className="min-h-12 w-full rounded-xl bg-primary text-[1rem] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {busy ? "Activating account…" : "Create account & Enter Dashboard"}
          </Button>
        </form>
      )}

      {/* LOGIN FORM */}
      {tab === "login" && (
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="login-username">Your username</Label>
            <Input
              id="login-username"
              value={loginUsername}
              onChange={(e) => { setLoginUsername(e.target.value); setError(null); }}
              placeholder="e.g. bobby_07"
              autoFocus
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Your password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showLoginPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setError(null); }}
                placeholder="Enter your password"
                required
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <Button
            type="submit"
            disabled={busy || !loginUsername.trim() || !loginPassword.trim()}
            className="min-h-12 w-full rounded-xl bg-primary text-[1rem] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
          >
            <LogIn className="mr-2 h-5 w-5" />
            {busy ? "Logging in…" : "Log in"}
          </Button>
        </form>
      )}

      {/* Coach Mode Footer Link */}
      <div className="pt-2 border-t border-border/60">
        <Button
          type="button"
          variant="ghost"
          onClick={() => { setTab("coach"); setError(null); }}
          className="min-h-10 w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
        >
          <ShieldCheck className="mr-1.5 h-4 w-4 text-primary" />
          Coach? Sign in with your master password
        </Button>
      </div>
    </div>
  );
}
