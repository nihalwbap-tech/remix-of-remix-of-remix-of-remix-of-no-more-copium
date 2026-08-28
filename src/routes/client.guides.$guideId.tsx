import { createFileRoute } from "@tanstack/react-router";
import { ClientGuideDetailPage } from "@/components/client/ClientGuideDetailPage";

export const Route = createFileRoute("/client/guides/$guideId")({
  head: () => ({
    meta: [
      { title: "Course Overview — No More Copium" },
      { name: "description", content: "Course modules and training curriculum." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientGuideDetailPage,
});
