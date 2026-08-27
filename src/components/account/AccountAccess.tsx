import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, ShieldCheck, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AppAccount,
  normalizeUsername,
  validateUsername,
  readLocalAccounts,
} from "@/lib/cloud-accounts";
import {
  clearAccessTicket,
  normalizeAccessCode,
  readAccessTicket,
  redeemAccessCode,
  storeAccessTicket,
  validateName,
} from "@/lib/access-codes";
import { useAccount } from "./AccountProvider";

type Phase = "entry" | "coach";

function enterRouteFor(account: AppAccount): string {
  if (account.role === "coach") return "/coach/dashboard";
  if (account.role === "payment_manager") return "/payment/dashboard";
  return "/client/dashboard";
}

export function AccountAccess() {
  const navigate = useNavigate();
  const { login, loginCoach, completeAccessCodeAccount } = useAccount();

  const [phase, setPhase] = useState<Phase>("entry");
  const [modalStep, setModalStep] = useState<"code" | "profile">("code");
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  // Voucher code state
  const [code, setCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Profile setup state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Coach password state
  const [coachPassword, setCoachPassword] = useState("");
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Stored local accounts for quick re-entry
  const localAccounts = readLocalAccounts().filter((a) => a.role === "client");

  const handleOpenVoucherModal = () => {
    setCode("");
    setCodeError(null);
    setDetailsError(null);
    setModalStep("code");
    setCodeModalOpen(true);
  };

  const submitCode = async () => {
    if (codeBusy || !code.trim()) return;
    setCodeError(null);
    const raw = code.trim();

    // Smart detection: If user pastes Coach master password into code box, log in directly
    if (raw === "Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD" || raw.includes("_")) {
      setCodeBusy(true);
      try {
        await loginCoach(raw);
        setCodeModalOpen(false);
        void navigate({ to: "/coach/dashboard" });
        return;
      } catch {
        // proceed
      } finally {
        setCodeBusy(false);
      }
    }

    setCodeBusy(true);
    try {
      const normalized = normalizeAccessCode(raw);
      const { ticket, expiresInSeconds } = await redeemAccessCode(normalized);
      storeAccessTicket(ticket, expiresInSeconds, raw);
      // Move to Step 2: Name & Username selection
      setModalStep("profile");
    } catch (nextError) {
      setCodeError(
        nextError instanceof Error
          ? nextError.message
          : "That code could not be checked. Please check the code and try again.",
      );
    } finally {
      setCodeBusy(false);
    }
  };

  const nameError = nameTouched ? validateName(name) : null;
  const usernameError = usernameTouched ? validateUsername(username) : null;

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setUsernameTouched(true);
    const nErr = validateName(name);
    const uErr = validateUsername(username);
    if (nErr || uErr) {
      setDetailsError(nErr ?? uErr ?? null);
      return;
    }

    let ticket = readAccessTicket();
    if (!ticket) {
      ticket = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    setDetailsBusy(true);
    setDetailsError(null);
    try {
      const account = await completeAccessCodeAccount(
        name.trim().replace(/\s+/g, " "),
        normalizeUsername(username),
        ticket,
      );
      clearAccessTicket();
      setCodeModalOpen(false);
      login(account);
      void navigate({ to: enterRouteFor(account) as never });
    } catch (nextError) {
      setDetailsError(
        nextError instanceof Error ? nextError.message : "Account creation failed.",
      );
    } finally {
      setDetailsBusy(false);
    }
  };

  const submitCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coachBusy || !coachPassword.trim()) return;
    setCoachBusy(true);
    setCoachError(null);
    try {
      await loginCoach(coachPassword);
      void navigate({ to: "/coach/dashboard" });
    } catch (nextError) {
      setCoachError(
        nextError instanceof Error
          ? nextError.message
          : "Coach sign-in failed. Please check the password and try again.",
      );
    } finally {
      setCoachBusy(false);
    }
  };

  const handleQuickLogin = (acc: AppAccount) => {
    login(acc);
    void navigate({ to: enterRouteFor(acc) as never });
  };

  if (phase === "coach") {
    return (
      <form onSubmit={submitCoach} className="space-y-5 text-left" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="coach-password">Coach Master Password</Label>
          <Input
            id="coach-password"
            type="password"
            value={coachPassword}
            onChange={(e) => setCoachPassword(e.target.value)}
            placeholder="Paste coach master password"
            autoFocus
            required
            className="rounded-xl"
            aria-invalid={!!coachError}
            aria-describedby={coachError ? "coach-error" : undefined}
          />
          {coachError && (
            <p id="coach-error" className="flex items-start gap-1.5 text-[0.875rem] leading-5 text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{coachError}</span>
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={coachBusy || !coachPassword.trim()}
          className="min-h-12 w-full rounded-xl text-[1rem] font-semibold"
        >
          {coachBusy ? "Signing in…" : "Sign in as Coach"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => { setPhase("entry"); setCoachPassword(""); setCoachError(null); }}
          className="min-h-11 w-full rounded-xl text-[0.9375rem]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to access page
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* 1. Enter Access Code (Primary Action) */}
      <Button
        type="button"
        onClick={handleOpenVoucherModal}
        className="min-h-12 w-full justify-center rounded-xl bg-primary text-[1rem] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
      >
        <KeyRound className="mr-2 h-5 w-5" aria-hidden="true" />
        Enter access code
      </Button>

      {/* Quick Access for returning client accounts on this device */}
      {localAccounts.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Accounts
          </p>
          <div className="grid gap-2">
            {localAccounts.map((acc) => (
              <Button
                key={acc.id}
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin(acc)}
                className="min-h-11 w-full justify-between rounded-xl border-border px-3.5 text-left text-[0.9375rem] hover:bg-muted/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate font-medium text-foreground">{acc.name}</span>
                  <span className="truncate text-xs text-muted-foreground">@{acc.username}</span>
                </div>
                <span className="text-xs text-primary font-semibold">Enter →</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Coach Login Link */}
      <div className="pt-3 border-t border-border/60">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setPhase("coach")}
          className="min-h-11 w-full rounded-xl text-[0.9375rem] font-medium text-muted-foreground hover:text-foreground"
        >
          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
          Coach Login (Hal)
        </Button>
      </div>

      {/* Access Code & Profile Activation Dialog */}
      <Dialog open={codeModalOpen} onOpenChange={setCodeModalOpen}>
        <DialogContent className="max-w-md rounded-xl p-6 bg-[#0d0d0d] border border-border text-left">
          {modalStep === "code" ? (
            <form
              onSubmit={(e) => { e.preventDefault(); void submitCode(); }}
              className="space-y-4"
              noValidate
            >
              <DialogHeader className="space-y-1.5 text-left">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Enter Your Access Code
                </DialogTitle>
                <DialogDescription className="text-[0.9375rem] text-muted-foreground">
                  Paste the single-use code your coach sent you in the DM.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="modal-access-code">Access Code</Label>
                <Input
                  id="modal-access-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste access code here"
                  autoFocus
                  required
                  disabled={codeBusy}
                  className="rounded-xl font-mono text-[1rem]"
                  aria-invalid={!!codeError}
                  aria-describedby={codeError ? "modal-code-error" : undefined}
                />
                {codeError && (
                  <p id="modal-code-error" className="flex items-start gap-1.5 text-[0.875rem] leading-5 text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{codeError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCodeModalOpen(false)}
                  className="min-h-11 flex-1 rounded-xl"
                  disabled={codeBusy}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={codeBusy || !code.trim()}
                  className="min-h-11 flex-1 rounded-xl font-semibold"
                >
                  {codeBusy ? "Verifying…" : "Submit code"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={submitProfile} className="space-y-4 text-left" noValidate>
              <DialogHeader className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                    Code Accepted!
                  </DialogTitle>
                </div>
                <DialogDescription className="text-[0.9375rem] text-muted-foreground">
                  Set your name and username to unlock your dashboard.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Your Full Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setDetailsError(null); }}
                    onBlur={() => setNameTouched(true)}
                    placeholder="e.g. Bobby"
                    autoFocus
                    required
                    maxLength={80}
                    className="rounded-xl"
                  />
                  {nameError && (
                    <p className="text-xs text-destructive">{nameError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-username">Your Username</Label>
                  <Input
                    id="profile-username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value.toLowerCase().trim()); setDetailsError(null); }}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder="e.g. bobby_07"
                    required
                    maxLength={30}
                    className="rounded-xl"
                  />
                  <p className="text-[0.75rem] text-muted-foreground">
                    3–30 lowercase letters (a–z), numbers, and underscores.
                  </p>
                  {usernameError && (
                    <p className="text-xs text-destructive">{usernameError}</p>
                  )}
                </div>

                {detailsError && (
                  <p className="text-[0.875rem] text-destructive leading-5" role="alert">
                    {detailsError}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={detailsBusy || !name.trim() || !username.trim()}
                  className="min-h-12 w-full rounded-xl font-semibold text-[1rem]"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {detailsBusy ? "Activating account…" : "Complete & Enter Dashboard"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
