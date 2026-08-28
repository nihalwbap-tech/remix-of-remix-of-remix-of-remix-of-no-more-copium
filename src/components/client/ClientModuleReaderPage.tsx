import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import { BooksShelfIcon } from "./BooksShelfIcon";
import { RichContentRenderer } from "./RichContentRenderer";
import type { Guide, ClientGuideProgress, GuideModule } from "@/lib/guides-types";
import {
  loadGuideById,
  loadClientGuideProgress,
  setModuleCompletion,
} from "@/lib/guides-storage";
import {
  LOCAL_GUIDES_CHANGED_EVENT,
  LOCAL_GUIDES_PROGRESS_CHANGED_EVENT,
} from "@/lib/local-events";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClientModuleReaderPage() {
  const { guideId, moduleId } = useParams({
    from: "/client/guides/$guideId/modules/$moduleId",
  });
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

  const sortedModules = useMemo(() => {
    return (guide?.modules ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  }, [guide]);

  const currentIndex = useMemo(() => {
    return sortedModules.findIndex((m) => m.id === moduleId);
  }, [sortedModules, moduleId]);

  const currentModule: GuideModule | null = useMemo(() => {
    return sortedModules[currentIndex] ?? null;
  }, [sortedModules, currentIndex]);

  const prevModule = currentIndex > 0 ? sortedModules[currentIndex - 1] : null;
  const nextModule =
    currentIndex >= 0 && currentIndex < sortedModules.length - 1
      ? sortedModules[currentIndex + 1]
      : null;

  const isDone = useMemo(() => {
    return progress.completedModuleIds?.includes(moduleId) ?? false;
  }, [progress, moduleId]);

  const handleToggleCompletion = () => {
    setModuleCompletion(clientId, guideId, moduleId, !isDone);
  };

  const handleCompleteAndNext = () => {
    if (!isDone) {
      setModuleCompletion(clientId, guideId, moduleId, true);
    }
    if (nextModule) {
      void navigate({
        to: "/client/guides/$guideId/modules/$moduleId",
        params: { guideId, moduleId: nextModule.id },
      });
    } else {
      void navigate({
        to: "/client/guides/$guideId",
        params: { guideId },
      });
    }
  };

  if (!guide || !currentModule) {
    return (
      <div className="space-y-6 text-left pb-10">
        <Link
          to="/client/guides/$guideId"
          params={{ guideId }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Course</span>
        </Link>
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
          <BooksShelfIcon className="h-10 w-10 text-muted-foreground opacity-50" />
          <h2 className="mt-3 text-base font-semibold text-foreground">Module not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">This module may have been moved or removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Top Bar with Back Link & Completion Tick Icon */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <Link
          to="/client/guides/$guideId"
          params={{ guideId }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{guide.title}</span>
        </Link>

        {/* Top-Right Tick / Completion Toggle */}
        <button
          type="button"
          onClick={handleToggleCompletion}
          title={isDone ? "Completed! Tap to mark incomplete" : "Tap to mark as completed"}
          aria-label={isDone ? "Completed! Tap to mark incomplete" : "Tap to mark as completed"}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-150 active:scale-[0.96]",
            isDone
              ? "border-emerald-500/50 bg-emerald-500 text-black shadow-[0_0_12px_rgba(34,197,94,0.4)] hover:bg-emerald-400"
              : "border-border bg-card/80 text-muted-foreground hover:border-emerald-500/40 hover:text-foreground",
          )}
        >
          <Check className={cn("h-4 w-4", isDone ? "stroke-[3] text-black" : "text-muted-foreground")} />
          <span>{isDone ? "Completed" : "Mark Complete"}</span>
        </button>
      </div>

      {/* Dynamic Top Image Banner (if provided by coach) */}
      {currentModule.topImageUrl && (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-md">
          <img
            src={currentModule.topImageUrl}
            alt={currentModule.title}
            className="w-full max-h-[380px] object-cover"
          />
        </div>
      )}

      {/* Module Heading & Metadata */}
      <div className="space-y-2 border-b border-border/40 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Module {String(currentIndex + 1).padStart(2, "0")} of {String(sortedModules.length).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {currentModule.estimatedReadMinutes ?? 4} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
          {currentModule.title}
        </h1>
      </div>

      {/* Rich Formatted Article Content */}
      <article className="prose-invert max-w-none">
        <RichContentRenderer content={currentModule.content} />
      </article>

      {/* Completion Status Confirmation Card */}
      <div className="rounded-xl border border-border bg-card/90 p-4 sm:p-5 my-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                isDone
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {isDone ? "Module Completed!" : "Finished reading this module?"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isDone
                  ? "Your progress is saved to your cloud profile."
                  : "Tap below to log your progress and advance to the next step."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant={isDone ? "outline" : "default"}
            onClick={handleToggleCompletion}
            className={cn(
              "h-9 text-xs font-semibold active:scale-[0.98]",
              isDone ? "border-emerald-500/40 text-emerald-400" : "bg-primary text-white",
            )}
          >
            {isDone ? "Completed ✓" : "Mark as Done"}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border/60">
        {prevModule ? (
          <Link
            to="/client/guides/$guideId/modules/$moduleId"
            params={{ guideId, moduleId: prevModule.id }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous: {prevModule.title.slice(0, 24)}…</span>
          </Link>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleCompleteAndNext}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <span>
            {nextModule
              ? isDone
                ? "Next Module"
                : "Complete & Continue"
              : isDone
                ? "Return to Course"
                : "Complete & Finish"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
