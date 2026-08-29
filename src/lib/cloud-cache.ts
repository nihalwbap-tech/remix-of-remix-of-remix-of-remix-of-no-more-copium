import { supabase } from "@/integrations/supabase/client";
import { emitLocalEvent } from "./local-events";
import { supabaseLoose } from "./supabase-loose-client";

/**
 * Cloud cache for coach-authored app state and library.
 *
 * The cloud stores coach content in ONE `app_state` row ('global') with
 * jsonb columns (programs, exercises, workouts, guides, weight_units).
 */

export type CloudAppState = {
  programs: unknown[];
  exercises: unknown[];
  workouts: unknown[];
  guides: unknown[];
  weightUnits: unknown[];
};

export const CLOUD_STATE_HYDRATED_EVENT = "no-more-copium:cloud-state-hydrated";

const EMPTY_STATE: CloudAppState = {
  programs: [],
  exercises: [],
  workouts: [],
  guides: [],
  weightUnits: [],
};

let cache: CloudAppState = { ...EMPTY_STATE };
let hydrated = false;
let hydratePromise: Promise<boolean> | null = null;

export function getCloudCache(): CloudAppState {
  return cache;
}

export function isCloudCacheHydrated(): boolean {
  return hydrated;
}

export function setCloudCacheField<K extends keyof CloudAppState>(
  field: K,
  value: CloudAppState[K],
): void {
  cache = { ...cache, [field]: value };
}

export async function hydrateCloudCache(): Promise<boolean> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      // 1. Direct query to app_state('global')
      const { data, error } = await supabaseLoose
        .from("app_state")
        .select("programs, exercises, workouts, guides, weight_units")
        .eq("id", "global")
        .maybeSingle();

      if (!error && data) {
        cache = {
          programs: Array.isArray(data.programs) ? data.programs : [],
          exercises: Array.isArray(data.exercises) ? data.exercises : [],
          workouts: Array.isArray(data.workouts) ? data.workouts : [],
          guides: Array.isArray(data.guides) ? data.guides : [],
          weightUnits: Array.isArray(data.weight_units) ? data.weight_units : [],
        };
        hydrated = true;
        emitLocalEvent(CLOUD_STATE_HYDRATED_EVENT);
        return true;
      }

      // 2. Client program bundle fallback
      const { data: bundleData, error: bundleError } = await supabaseLoose.rpc(
        "get_client_program_bundle",
      );
      const bundle = bundleData as
        | {
            program?: unknown;
            workouts?: unknown;
            exercises?: unknown;
            weight_units?: unknown;
          }
        | null;
      if (!bundleError && bundle && bundle.program) {
        cache = {
          programs: [bundle.program],
          workouts: Array.isArray(bundle.workouts) ? bundle.workouts : [],
          exercises: Array.isArray(bundle.exercises) ? bundle.exercises : [],
          guides: [],
          weightUnits: Array.isArray(bundle.weight_units) ? bundle.weight_units : [],
        };
        hydrated = true;
        emitLocalEvent(CLOUD_STATE_HYDRATED_EVENT);
        return true;
      }

      hydrated = true;
      emitLocalEvent(CLOUD_STATE_HYDRATED_EVENT);
      return true;
    } catch (error) {
      console.warn("Cloud state hydrate notice:", error);
      return false;
    } finally {
      hydratePromise = null;
    }
  })();
  return hydratePromise;
}

/** Direct write-through persist to Supabase PostgreSQL app_state */
export async function persistCloudAppStateField(
  field: "programs" | "exercises" | "workouts" | "guides" | "weight_units",
): Promise<void> {
  try {
    const value = field === "weight_units" ? cache.weightUnits : cache[field];
    const payload = { [field]: value, id: "global", updated_at: new Date().toISOString() };
    const { error } = await supabaseLoose.from("app_state").upsert(payload);
    if (error) console.warn("Cloud app_state upsert notice:", error.message);
  } catch (error) {
    console.warn("Cloud app_state persist notice:", error);
  }
}

export function invalidateCloudCache(): void {
  hydrated = false;
  hydratePromise = null;
}
