export interface GuideModule {
  id: string;
  guideId: string;
  title: string;
  orderIndex: number;
  topImageUrl?: string;
  content: string; // Rich markdown / formatted text
  estimatedReadMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  isPublished: boolean;
  orderIndex: number;
  modules: GuideModule[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientGuideProgress {
  clientId: string;
  guideId: string;
  completedModuleIds: string[];
  lastReadModuleId?: string;
  updatedAt: string;
}

export type GuidesProgressMap = Record<string, ClientGuideProgress>;
