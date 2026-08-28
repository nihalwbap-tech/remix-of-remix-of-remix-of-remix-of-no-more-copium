import { createFileRoute } from "@tanstack/react-router";
import { CoachGuidesPage } from "@/components/coach/CoachGuidesPage";

export const Route = createFileRoute("/coach/guides")({
  head: () => ({
    meta: [
      { title: "Guides Studio — No More Copium" },
      { name: "description", content: "Create and edit training guides." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoachGuidesPage,
});
