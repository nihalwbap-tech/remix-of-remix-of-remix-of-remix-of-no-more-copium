import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, ChevronRight, Clock, Sparkles } from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import { BooksShelfIcon } from "./BooksShelfIcon";
import type { Guide, ClientGuideProgress } from "@/lib/guides-types";
import {
  loadGuides,
  loadAllClientGuidesProgress,
  syncGuidesFromCloud,
} from "@/lib/guides-storage";
import {
  LOCAL_GUIDES_CHANGED_EVENT,
  LOCAL_GUIDES_PROGRESS_CHANGED_EVENT,
} from "@/lib/local-events";
import { cn } from "@/lib/utils";

export function ClientGuidesPage() {
  const { account } = useAccount();
  const clientId = account?.id ?? "client-prototype";

  const [guides, setGuides] = useState<Guide[]>(() => loadGuides());
  const [progressMap, setProgressMap] = useState<Record<string, ClientGuideProgress>>(() =>
    loadAllClientGuidesProgress(clientId),
  );

  useEffect(() => {
    const handleGuidesChanged = () => {
      setGuides(loadGuides());
    };

    const handleProgressChanged = () => {
      setProgressMap(loadAllClientGuidesProgress(clientId));
    };

    window.addEventListener(LOCAL_GUIDES_CHANGED_EVENT, handleGuidesChanged);
    window.addEventListener(LOCAL_GUIDES_PROGRESS_CHANGED_EVENT, handleProgressChanged);

    // Hydrate latest guides from cloud in background
    void syncGuidesFromCloud().then((cloudGuides) => {
      if (cloudGuides && cloudGuides.length > 0) {
        setGuides(cloudGuides);
      }
    });

    return () => {
      window.removeEventListener(LOCAL_GUIDES_CHANGED_EVENT, handleGuidesChanged);
      window.removeEventListener(LOCAL_GUIDES_PROGRESS_CHANGED_EVENT, handleProgressChanged);
    };
  }, [clientId]);

  // Filter published guides for clients
  const publishedGuides = useMemo(() => {
    return guides
      .filter((g) => g.isPublished !== false)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [guides]);

  // Overall stats
  const stats = useMemo(() => {
    let totalModules = 0;
    let completedModules = 0;

    for (const guide of publishedGuides) {
      const guideModulesCount = guide.modules?.length ?? 0;
      totalModules += guideModulesCount;
      const progress = progressMap[guide.id];
      completedModules += progress?.completedModuleIds?.length ?? 0;
    }

    const overallPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    return { totalGuides: publishedGuides.length, totalModules, completedModules, overallPct };
  }, [publishedGuides, progressMap]);

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[1.375rem] font-bold tracking-tight text-foreground">Guides</h1>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Academy
            </span>
          </div>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">
            Hypertrophy protocols, nutrition timing, and elite coaching knowledge.
          </p>
        </div>

        {stats.totalModules > 0 && (
          <div className="flex items-center gap-2 self-start rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              <strong className="font-semibold text-foreground">{stats.completedModules}</strong>/
              {stats.totalModules} modules finished ({stats.overallPct}%)
            </span>
          </div>
        )}
      </div>

      {/* Guides Grid */}
      {publishedGuides.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card/60 p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <BooksShelfIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-[1.125rem] font-semibold text-foreground">Guides coming soon</h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Coach Hal will publish exclusive hypertrophy protocols, recovery guides, and training resources here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {publishedGuides.map((guide) => {
            const modules = guide.modules ?? [];
            const totalModules = modules.length;
            const progress = progressMap[guide.id];
            const completedCount = progress?.completedModuleIds?.length ?? 0;
            const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
            const isCompleted = percentage === 100 && totalModules > 0;

            const totalReadMinutes = modules.reduce(
              (sum, m) => sum + (m.estimatedReadMinutes ?? 4),
              0,
            );

            return (
              <Link
                key={guide.id}
                to="/client/guides/$guideId"
                params={{ guideId: guide.id }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-150 hover:border-white/25 hover:shadow-lg active:scale-[0.98]"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  {guide.coverImageUrl ? (
                    <img
                      src={guide.coverImageUrl}
                      alt={guide.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-muted-foreground">
                      <BooksShelfIcon className="h-12 w-12 opacity-40" />
                    </div>
                  )}

                  {/* Top Badge Overlay */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md border border-black/40 bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    <BookOpen className="h-3 w-3 text-primary" />
                    <span>{totalModules} {totalModules === 1 ? "Module" : "Modules"}</span>
                  </div>

                  {isCompleted && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>

                {/* Card Content Area */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {guide.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {guide.description || "Comprehensive guide and protocols."}
                    </p>
                  </div>

                  {/* Skool-Inspired Progress Bar with Leftmost Percentage Badge */}
                  <div className="space-y-2 pt-1 border-t border-border/40">
                    <div className="flex items-center gap-2.5">
                      {/* Leftmost Percentage Badge with Black Text */}
                      <div className="flex shrink-0 items-center justify-center rounded bg-zinc-200 px-1.5 py-0.5 shadow-sm">
                        <span className="text-[11px] font-black tracking-tight text-black tabular-nums">
                          {percentage}%
                        </span>
                      </div>

                      {/* Long Horizontal Progress Track */}
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/60 border border-border/40">
                        <div
                          className={cn(
                            "h-full transition-all duration-300 ease-out",
                            isCompleted ? "bg-emerald-500" : "bg-primary",
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata Sub-Row */}
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground tracking-wide">
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums">
                          {completedCount} of {totalModules} completed
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {totalReadMinutes} min read
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 text-foreground font-semibold group-hover:text-primary transition-colors">
                        <span>{completedCount === 0 ? "Start" : isCompleted ? "Review" : "Continue"}</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
