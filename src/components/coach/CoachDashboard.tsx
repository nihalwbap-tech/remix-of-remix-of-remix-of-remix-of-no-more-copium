import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Eye, EyeOff, KeyRound, Copy, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AppAccount, fetchAccounts } from "@/lib/cloud-accounts";
import { JoinRequestsSection } from "./JoinRequestsSection";
import { PayoutApprovalsSection } from "./PayoutApprovalsSection";
import { PendingPaymentsSection } from "./PendingPaymentsSection";

export function CoachDashboard() {
  const [clients, setClients] = useState<AppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client Password Modal State
  const [selectedClient, setSelectedClient] = useState<AppAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAccounts()
      .then((accounts) => setClients(accounts.filter((account) => account.role === "client")))
      .catch((nextError: unknown) => {
        console.error(nextError);
        setError("Local clients could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopyPassword = () => {
    if (!selectedClient?.password) return;
    void navigator.clipboard.writeText(selectedClient.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your clients and look up credentials.</p>
      </div>

      <JoinRequestsSection />

      <PendingPaymentsSection />

      <PayoutApprovalsSection />

      <section aria-labelledby="clients-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="clients-heading" className="text-lg font-semibold text-foreground">
            Clients
          </h2>
          {!loading && clients.length > 0 && (
            <span className="text-sm text-muted-foreground">{clients.length}</span>
          )}
        </div>

        {error ? (
          <p className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : loading ? (
          <div className="h-24 w-full rounded-xl bg-muted/60 skeleton-shimmer" />
        ) : clients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Users className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-medium text-foreground">No clients yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Client accounts created with access codes appear here.
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border rounded-xl border border-border bg-card">
            {clients.map((client) => (
              <li key={client.id} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/30">
                <Link
                  to="/coach/clients/$clientId"
                  params={{ clientId: client.id }}
                  className="min-w-0 flex-1 text-left"
                  aria-label={`Manage ${client.username}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[0.9375rem] font-semibold text-foreground">{client.name}</p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">@{client.username}</p>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(false);
                      setCopied(false);
                      setSelectedClient(client);
                    }}
                    className="h-8 gap-1.5 rounded-lg text-xs font-medium border-border hover:bg-primary/10 hover:text-primary"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <span>Password</span>
                  </Button>

                  <Link
                    to="/coach/clients/$clientId"
                    params={{ clientId: client.id }}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Client Password Reveal Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="max-w-md rounded-xl p-6 bg-[#0d0d0d] border border-border text-left">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-xl font-bold text-foreground">
              Client Credentials
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedClient?.name} (@{selectedClient?.username})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</p>
              <div className="flex items-center justify-between rounded-lg border border-border bg-black/40 px-3 py-2">
                <span className="font-mono text-sm text-foreground">@{selectedClient?.username}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedClient?.username) void navigator.clipboard.writeText(selectedClient.username);
                  }}
                  className="h-7 text-xs"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</p>
              <div className="flex items-center justify-between rounded-lg border border-border bg-black/40 px-3 py-2">
                <span className="font-mono text-sm text-foreground">
                  {showPassword ? selectedClient?.password || "(No password)" : "••••••••••••"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="h-7 gap-1 text-xs"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              If your client forgets their password, copy it here and send it to them in their DM.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setSelectedClient(null)}
            className="w-full rounded-xl min-h-11 font-semibold"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
