import { emitLocalEvent, LOCAL_GUIDES_CHANGED_EVENT, LOCAL_GUIDES_PROGRESS_CHANGED_EVENT } from "./local-events";
import { DEFAULT_SEED_GUIDES } from "./guides-seed";
import type { ClientGuideProgress, Guide, GuideModule, GuidesProgressMap } from "./guides-types";
import { supabaseLoose } from "./supabase-loose-client";

export const GUIDES_STORAGE_KEY = "no-more-copium:guides:v1";
export const GUIDES_PROGRESS_STORAGE_KEY = "no-more-copium:guides-progress:v1";

let cachedGuides: Guide[] | null = null;
let cachedProgressMap: GuidesProgressMap | null = null;

export function loadGuides(): Guide[] {
  if (typeof window === "undefined") return DEFAULT_SEED_GUIDES;

  if (cachedGuides && cachedGuides.length > 0) {
    return cachedGuides;
  }

  try {
    const raw = localStorage.getItem(GUIDES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedGuides = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not parse local guides:", err);
  }

  // Fallback to default seed guides
  cachedGuides = DEFAULT_SEED_GUIDES;
  try {
    localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_GUIDES));
  } catch {}

  // Trigger background cloud sync
  void syncGuidesFromCloud();

  return DEFAULT_SEED_GUIDES;
}

export function loadGuideById(guideId: string): Guide | null {
  const guides = loadGuides();
  return guides.find((g) => g.id === guideId) ?? null;
}

export function loadModuleById(guideId: string, moduleId: string): GuideModule | null {
  const guide = loadGuideById(guideId);
  if (!guide) return null;
  return guide.modules.find((m) => m.id === moduleId) ?? null;
}

export function saveGuides(guides: Guide[]): void {
  if (typeof window === "undefined") return;
  cachedGuides = guides;
  try {
    localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(guides));
    emitLocalEvent(LOCAL_GUIDES_CHANGED_EVENT);
  } catch (err) {
    console.error("Could not write guides to localStorage:", err);
  }

  // Dual write-through to cloud
  void persistGuidesToCloud(guides);
}

export function saveGuide(guide: Guide): void {
  const guides = loadGuides();
  const existingIdx = guides.findIndex((g) => g.id === guide.id);
  let nextGuides: Guide[];

  if (existingIdx >= 0) {
    nextGuides = [...guides];
    nextGuides[existingIdx] = { ...guide, updatedAt: new Date().toISOString() };
  } else {
    nextGuides = [...guides, { ...guide, updatedAt: new Date().toISOString() }];
  }

  saveGuides(nextGuides);
}

export function deleteGuide(guideId: string): void {
  const guides = loadGuides();
  const nextGuides = guides.filter((g) => g.id !== guideId);
  saveGuides(nextGuides);
}

export async function syncGuidesFromCloud(): Promise<Guide[]> {
  try {
    const { data, error } = await supabaseLoose
      .from("app_state")
      .select("programs")
      .eq("id", "cloud_guides_vault")
      .maybeSingle();

    if (!error && data && Array.isArray(data.programs) && data.programs.length > 0) {
      const cloudGuides = data.programs as Guide[];
      cachedGuides = cloudGuides;
      if (typeof window !== "undefined") {
        localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(cloudGuides));
        emitLocalEvent(LOCAL_GUIDES_CHANGED_EVENT);
      }
      return cloudGuides;
    }
  } catch (err) {
    console.warn("syncGuidesFromCloud fallback:", err);
  }

  return loadGuides();
}

export async function persistGuidesToCloud(guides: Guide[]): Promise<void> {
  try {
    await supabaseLoose.from("app_state").upsert({
      id: "cloud_guides_vault",
      programs: guides as unknown as unknown[],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("persistGuidesToCloud error:", err);
  }
}

// -------------------------------------------------------------
// CLIENT PROGRESS TRACKING
// -------------------------------------------------------------

function readLocalProgressMap(): GuidesProgressMap {
  if (typeof window === "undefined") return {};
  if (cachedProgressMap) return cachedProgressMap;

  try {
    const raw = localStorage.getItem(GUIDES_PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GuidesProgressMap;
      cachedProgressMap = parsed;
      return parsed;
    }
  } catch {}

  return {};
}

function writeLocalProgressMap(map: GuidesProgressMap): void {
  cachedProgressMap = map;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUIDES_PROGRESS_STORAGE_KEY, JSON.stringify(map));
    emitLocalEvent(LOCAL_GUIDES_PROGRESS_CHANGED_EVENT);
  } catch {}
}

export function loadAllClientGuidesProgress(clientId: string): Record<string, ClientGuideProgress> {
  const map = readLocalProgressMap();
  const prefix = `${clientId}::`;
  const result: Record<string, ClientGuideProgress> = {};

  for (const [key, val] of Object.entries(map)) {
    if (key.startsWith(prefix)) {
      result[val.guideId] = val;
    }
  }

  return result;
}

export function loadClientGuideProgress(clientId: string, guideId: string): ClientGuideProgress {
  const map = readLocalProgressMap();
  const key = `${clientId}::${guideId}`;
  return (
    map[key] ?? {
      clientId,
      guideId,
      completedModuleIds: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

export function saveClientGuideProgress(progress: ClientGuideProgress): void {
  const map = readLocalProgressMap();
  const key = `${progress.clientId}::${progress.guideId}`;
  const nextMap: GuidesProgressMap = {
    ...map,
    [key]: { ...progress, updatedAt: new Date().toISOString() },
  };

  writeLocalProgressMap(nextMap);

  // Sync progress to cloud vault
  void persistClientProgressToCloud(progress);
}

export function isModuleCompleted(clientId: string, guideId: string, moduleId: string): boolean {
  const progress = loadClientGuideProgress(clientId, guideId);
  return progress.completedModuleIds.includes(moduleId);
}

export function setModuleCompletion(
  clientId: string,
  guideId: string,
  moduleId: string,
  completed: boolean,
): ClientGuideProgress {
  const current = loadClientGuideProgress(clientId, guideId);
  const exists = current.completedModuleIds.includes(moduleId);

  let nextCompleted: string[];
  if (completed && !exists) {
    nextCompleted = [...current.completedModuleIds, moduleId];
  } else if (!completed && exists) {
    nextCompleted = current.completedModuleIds.filter((id) => id !== moduleId);
  } else {
    return current;
  }

  const updated: ClientGuideProgress = {
    ...current,
    completedModuleIds: nextCompleted,
    lastReadModuleId: moduleId,
    updatedAt: new Date().toISOString(),
  };

  saveClientGuideProgress(updated);
  return updated;
}

export function toggleModuleCompletion(
  clientId: string,
  guideId: string,
  moduleId: string,
): boolean {
  const current = loadClientGuideProgress(clientId, guideId);
  const isCurrentlyDone = current.completedModuleIds.includes(moduleId);
  setModuleCompletion(clientId, guideId, moduleId, !isCurrentlyDone);
  return !isCurrentlyDone;
}

export async function persistClientProgressToCloud(progress: ClientGuideProgress): Promise<void> {
  try {
    const vaultId = `client_progress_${progress.clientId}`;
    const { data: row } = await supabaseLoose
      .from("app_state")
      .select("programs")
      .eq("id", vaultId)
      .maybeSingle();

    const existingArray: ClientGuideProgress[] = Array.isArray(row?.programs)
      ? (row.programs as ClientGuideProgress[])
      : [];

    const updatedArray = [
      ...existingArray.filter((p) => p.guideId !== progress.guideId),
      progress,
    ];

    await supabaseLoose.from("app_state").upsert({
      id: vaultId,
      programs: updatedArray as unknown as unknown[],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("persistClientProgressToCloud err:", err);
  }
}
