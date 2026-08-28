import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import { BooksShelfIcon } from "./BooksShelfIcon";
import type { Guide, ClientGuideProgress } from "@/lib/guides-types";
import {
  loadGuideById,
  loadClientGuideProgress,
  setModuleCompletion,
} from "@/lib/guides-storage";
import {
  LOCAL_GUIDES_CHANGED_EVENT,
  LOCAL_GUIDES_PROGRESS_CHANGED_EVENT,
} from "@/lib/local-events";
import { cn } from "@/lib/utils";

export function ClientGuideDetailPage() {
  const { guideId } = useParams({ from: "/client/guides/$guideId" });
  const navigate = useNavigate();
  const { account } = useAccount();
  const clientId = account?.id ?? "client-prototype";

  const [guide, setGuide] = useState<Guide | null>(() => loadGuideById(guideId));
  const [progress, setProgress] = useState<ClientGuideProgress>(() =>
    loadClientGuideProgress(clientId, guideId),
  );

  useEffect(() => {
    const handleGuidesChanged = () => {
      setGuide(loadGuideById(guideId));
    };

    const handleProgressChanged = () => {
      setProgress(loadClientGuideProgress(clientId, guideId));
    };

    window.addEventListener(LOCAL_GUIDES_CHANGED_EVENT, handleGuidesChanged);
    window.addEventListener(LOCAL_GUIDES_PROGRESS_CHANGED_EVENT, handleProgressChanged);

    return () => {
      window.removeEventListener(LOCAL_GUIDES_CHANGED_EVENT, handleGuidesChanged);
      window.removeEventListener(LOCAL_GUIDES_PROGRESS_CHANGED_EVENT, handleProgressChanged);
    };
  }, [clientId, guideId]);

  const modules = useMemo(() => {
    return (guide?.modules ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  }, [guide]);

  const completedSet = useMemo(() => {
    return new Set(progress.completedModuleIds ?? []);
  }, [progress]);

  const totalModules = modules.length;
  const completedCount = completedSet.size;
  const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const isAllCompleted = percentage === 100 && totalModules > 0;

  const totalReadMinutes = useMemo(() => {
    return modules.reduce((sum, m) => sum + (m.estimatedReadMinutes ?? 4), 0);
  }, [modules]);

  // First unread module for "Continue" button
  const nextModuleToRead = useMemo(() => {
    return modules.find((m) => !completedSet.has(m.id)) ?? modules[0];
  }, [modules, completedSet]);

  if (!guide) {
    return (
      <div className="space-y-6 text-left pb-10">
        <Link
          to="/client/guides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Guides</span>
        </Link>
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
          <BooksShelfIcon className="h-10 w-10 text-muted-foreground opacity-50" />
          <h2 className="mt-3 text-base font-semibold text-foreground">Guide not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">This guide may have been archived or removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/client/guides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Guides</span>
        </Link>
        <span className="rounded-md border border-border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Course Overview
        </span>
      </div>

      {/* Hero Banner Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {guide.coverImageUrl && (
          <div className="relative aspect-[21/9] sm:aspect-[3/1] w-full overflow-hidden bg-muted">
            <img
              src={guide.coverImageUrl}
              alt={guide.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <span className="rounded-md border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                {totalModules} Modules · {totalReadMinutes} min total
              </span>
              {isAllCompleted && (
                <span className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>100% Completed</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Title & Description */}
        <div className="p-4 sm:p-5 space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {guide.title}
            </h1>
            <p className="mt-1.5 text-sm sm:text-[0.9375rem] text-muted-foreground leading-relaxed">
              {guide.description}
            </p>
          </div>

          {/* Skool-Inspired Progress Bar with Leftmost Percentage Badge */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Course Progress
              </span>
              <span className="text-muted-foreground font-medium tabular-nums">
                {completedCount} of {totalModules} modules finished
              </span>
            </div>

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
                    isAllCompleted ? "bg-emerald-500" : "bg-primary",
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          {nextModuleToRead && !isAllCompleted && (
            <Link
              to="/client/guides/$guideId/modules/$moduleId"
              params={{ guideId: guide.id, moduleId: nextModuleToRead.id }}
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              <span>{completedCount === 0 ? "Start First Module" : "Continue Next Module"}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Modules List with Dynamic Connected Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Course Modules ({totalModules})
          </h2>
          <span className="text-xs text-muted-foreground">
            Tap a module to begin reading
          </span>
        </div>

        <div className="space-y-0 relative">
          {modules.map((mod, index) => {
            const isDone = completedSet.has(mod.id);
            const isLast = index === modules.length - 1;
            const nextMod = modules[index + 1];
            const nextIsDone = nextMod ? completedSet.has(nextMod.id) : false;

            // Connector line condition: if both this module and next module are done -> green line; otherwise muted gap line
            const isLineGreen = isDone && nextIsDone;

            return (
              <div key={mod.id} className="relative flex items-stretch group">
                {/* Timeline Column */}
                <div className="flex flex-col items-center mr-3 sm:mr-4 shrink-0">
                  {/* Circular Ring (Height matched to capital English letter: 16px / h-4 w-4) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModuleCompletion(clientId, guide.id, mod.id, !isDone);
                    }}
                    title={isDone ? "Mark as incomplete" : "Mark as complete"}
                    aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
                    className={cn(
                      "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200 mt-4",
                      isDone
                        ? "bg-emerald-500 border-2 border-emerald-400 text-black shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        : "border-2 border-zinc-600 bg-background/90 hover:border-zinc-400",
                    )}
                  >
                    {isDone && <Check className="h-2.5 w-2.5 stroke-[3.5] text-black" />}
                  </button>

                  {/* Vertical Connector Line (Extending down to next module) */}
                  {!isLast && (
                    <div
                      className={cn(
                        "w-[2px] flex-1 my-1 transition-colors duration-300",
                        isLineGreen
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                          : "bg-border/60",
                      )}
                      style={{ minHeight: "36px" }}
                    />
                  )}
                </div>

                {/* Module Card */}
                <Link
                  to="/client/guides/$guideId/modules/$moduleId"
                  params={{ guideId: guide.id, moduleId: mod.id }}
                  className={cn(
                    "flex flex-1 items-center justify-between rounded-xl border p-3.5 sm:p-4 mb-3 transition-all duration-150 active:scale-[0.99]",
                    isDone
                      ? "border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40"
                      : "border-border bg-card hover:border-white/20",
                  )}
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Module {String(index + 1).padStart(2, "0")}
                      </span>
                      {isDone && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                          Finished
                        </span>
                      )}
                    </div>
                    <h3
                      className={cn(
                        "text-sm sm:text-base font-semibold leading-snug transition-colors line-clamp-1",
                        isDone
                          ? "text-foreground group-hover:text-emerald-400"
                          : "text-foreground group-hover:text-primary",
                      )}
                    >
                      {mod.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{mod.estimatedReadMinutes ?? 4} min read</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
