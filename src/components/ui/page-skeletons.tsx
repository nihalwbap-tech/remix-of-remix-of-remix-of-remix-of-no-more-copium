import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * High-fidelity, layout-matched skeleton loaders for all client & coach pages.
 * Features the signature skeleton-shimmer-wave on dark pitch-black surfaces.
 */

// ---------------------------------------------------------------------------
// CLIENT PAGE SKELETONS
// ---------------------------------------------------------------------------

export function ClientDashboardSkeleton() {
  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      {/* Header Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-7 w-48 rounded-lg" />
      </div>

      {/* Daily Progress Picture Streak Card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>

        {/* 7-Level Graph Skeleton */}
        <div className="h-28 w-full rounded-lg bg-muted/40 p-2 flex items-end justify-between gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-md"
              style={{ height: `${20 + i * 12}%` }}
            />
          ))}
        </div>
      </div>

      {/* Today's Workout Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        {/* Workout Card */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Progress Picture Upload Prompt Card */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ClientProgramSkeleton() {
  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      {/* Program Banner */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-56 rounded-md" />
        <Skeleton className="h-4 w-full max-w-sm rounded-md" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>
      </div>

      {/* 7-Day Schedule Matrix */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 rounded-md" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClientWorkoutPlayerSkeleton() {
  return (
    <div className="space-y-6 text-left pb-16 animate-fade-in">
      {/* Header & Elapsed Timer */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-6 w-44 rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Active Exercise Card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        {/* Sets Table Skeleton */}
        <div className="space-y-2 pt-2">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-12 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ClientGuidesSkeleton() {
  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>
        <Skeleton className="h-8 w-36 rounded-xl" />
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card space-y-3"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-3/4 rounded" />

              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-10 rounded" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientGuideDetailSkeleton() {
  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>

      {/* Hero Cover Art */}
      <div className="rounded-xl border border-border bg-card overflow-hidden space-y-4">
        <Skeleton className="aspect-[21/9] sm:aspect-[3/1] w-full" />
        <div className="p-4 sm:p-5 space-y-3">
          <Skeleton className="h-7 w-56 rounded-md" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />

          {/* Skool Progress Bar Skeleton */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10 rounded" />
              <Skeleton className="h-2 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Connected Checklist Timeline Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36 rounded" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
              <div className="flex-1 rounded-xl border border-border bg-card p-3.5 flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClientModuleReaderSkeleton() {
  return (
    <div className="space-y-6 text-left pb-16 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Dynamic Top Banner */}
      <Skeleton className="aspect-[16/9] max-h-72 w-full rounded-xl" />

      {/* Heading */}
      <div className="space-y-2 border-b border-border/40 pb-5">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <Skeleton className="h-8 w-3/4 rounded-md" />
      </div>

      {/* Typography Lines */}
      <div className="space-y-4 pt-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-6 w-48 rounded-md mt-6" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-9/12 rounded" />
        <div className="rounded-r-xl border-l-4 border-primary/40 bg-primary/5 p-4 space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-border/60">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}

export function ClientProgressPicturesSkeleton() {
  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Consistency Graph */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>

      {/* Photo Batches Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ClientWorkoutHistorySkeleton() {
  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44 rounded-lg" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </div>

      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientChatSkeleton() {
  return (
    <div className="flex flex-col h-[75vh] max-w-3xl mx-auto rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3.5 border-b border-border/60 bg-muted/20">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>

      {/* Message Bubbles Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex items-start gap-2 max-w-[80%]">
          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          <Skeleton className="h-14 w-60 rounded-2xl" />
        </div>

        <div className="flex items-end justify-end">
          <Skeleton className="h-10 w-48 rounded-2xl" />
        </div>

        <div className="flex items-start gap-2 max-w-[80%]">
          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          <Skeleton className="h-20 w-72 rounded-2xl" />
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-border/60 bg-muted/10 flex items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

export function ClientMoreSkeleton() {
  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      <div className="space-y-1">
        <Skeleton className="h-7 w-28 rounded-lg" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>

      {/* Face Analysis Card Banner */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Nav Tiles */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COACH PAGE SKELETONS
// ---------------------------------------------------------------------------

export function CoachDashboardSkeleton() {
  return (
    <div className="space-y-6 text-left pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Clients Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-5 w-8 rounded-md" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        {/* Clients Table / Rows */}
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/60">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CoachProgramsSkeleton() {
  return (
    <div className="space-y-6 text-left pb-16 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-44 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 flex items-center justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-64 rounded" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachGuidesStudioSkeleton() {
  return (
    <div className="space-y-6 text-left pb-16 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <Skeleton className="h-12 w-16 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-44 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                  <Skeleton className="h-3.5 w-60 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachAccessCodesSkeleton() {
  return (
    <div className="space-y-6 text-left pb-16 animate-fade-in">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-4 w-60 rounded-md" />
      </div>

      {/* Generator Form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-44 rounded-md" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Active Codes List */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-md" />
        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3.5 flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-36 rounded font-mono" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AccessHubSkeleton() {
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10 text-center animate-fade-in">
      {/* Red Skull Icon Placeholder */}
      <div className="flex justify-center">
        <Skeleton className="h-16 w-16 rounded-2xl" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-7 w-48 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-64 mx-auto rounded-md" />
      </div>

      {/* Tab Selectors */}
      <div className="rounded-lg bg-muted/40 p-1 flex gap-1">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>

      {/* Form Fields */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl mt-4" />
      </div>
    </div>
  );
}
