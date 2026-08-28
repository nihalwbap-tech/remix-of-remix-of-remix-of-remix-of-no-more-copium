/**
 * High-Performance Route & Data Preloader for Instant Viewport Navigation.
 *
 * After initial page hydration, preloads sibling routes and caches static assets
 * in priority order with staggered timeouts to prevent blocking the main thread.
 * Enables 0ms perception latency on bottom navigation taps and course browsing.
 */

type RouterLike = {
  preloadRoute: (opts: { to: string; params?: Record<string, string> }) => Promise<unknown>;
};

const COACH_ROUTES_PRIORITY = [
  "/coach/dashboard",
  "/coach/programs",
  "/coach/guides",
  "/coach/library",
  "/coach/chat",
  "/coach/access-codes",
] as const;

const CLIENT_ROUTES_PRIORITY = [
  "/client/dashboard",
  "/client/program",
  "/client/guides",
  "/client/progress-pictures",
  "/client/workout-history",
  "/client/chat",
  "/client/more",
] as const;

let preloadedCoach = false;
let preloadedClient = false;

export async function preloadCoachRoutes(router: RouterLike) {
  if (preloadedCoach) return;
  preloadedCoach = true;

  // Staggered priority route preloading
  for (const to of COACH_ROUTES_PRIORITY.slice(0, 3)) {
    try {
      await router.preloadRoute({ to });
    } catch {}
    await sleep(80);
  }

  for (const to of COACH_ROUTES_PRIORITY.slice(3)) {
    try {
      await router.preloadRoute({ to });
    } catch {}
    await sleep(80);
  }

  // Pre-warm local and cloud caches
  try {
    const { loadGuides } = await import("@/lib/guides-storage");
    loadGuides();
  } catch {}
  await sleep(40);

  try {
    const { loadPrograms } = await import("@/lib/coach-programs");
    loadPrograms();
  } catch {}
  await sleep(40);

  try {
    const { loadExercises } = await import("@/lib/coach-exercises");
    const { loadWorkouts } = await import("@/lib/coach-workouts");
    loadExercises();
    loadWorkouts();
  } catch {}
  await sleep(40);

  try {
    const { fetchAccounts } = await import("@/lib/cloud-accounts");
    await fetchAccounts();
  } catch {}
}

export async function preloadClientRoutes(router: RouterLike) {
  if (preloadedClient) return;
  preloadedClient = true;

  // Staggered priority route preloading
  for (const to of CLIENT_ROUTES_PRIORITY.slice(0, 3)) {
    try {
      await router.preloadRoute({ to });
    } catch {}
    await sleep(80);
  }

  for (const to of CLIENT_ROUTES_PRIORITY.slice(3)) {
    try {
      await router.preloadRoute({ to });
    } catch {}
    await sleep(80);
  }

  // Pre-warm client program and guides data
  try {
    const { loadGuides } = await import("@/lib/guides-storage");
    loadGuides();
  } catch {}
  await sleep(40);

  try {
    const { loadPrograms } = await import("@/lib/coach-programs");
    loadPrograms();
  } catch {}
}

export function resetPreload() {
  preloadedCoach = false;
  preloadedClient = false;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function warmStaticCache() {
  try {
    const { cacheStaticUI } = await import("./static-cache");
    cacheStaticUI();
  } catch {}
}
