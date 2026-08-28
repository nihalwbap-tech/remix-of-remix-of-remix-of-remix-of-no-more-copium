import { BooksShelfIcon } from "./BooksShelfIcon";

export function ClientGuidesPage() {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-[1.375rem] font-bold tracking-tight text-foreground">Guides</h1>
        <p className="mt-1 text-[0.9375rem] text-muted-foreground">
          Comprehensive training protocols, knowledge base, and guides.
        </p>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card/60 p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <BooksShelfIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-[1.125rem] font-semibold text-foreground">Guides coming soon</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Your coach will publish exclusive hypertrophy protocols, recovery guides, and training resources here.
        </p>
      </div>
    </div>
  );
}
