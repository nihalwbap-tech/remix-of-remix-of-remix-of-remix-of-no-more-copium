import { createFileRoute } from "@tanstack/react-router";
import { ClientGuidesPage } from "@/components/client/ClientGuidesPage";

export const Route = createFileRoute("/client/guides/")({
  head: () => ({
    meta: [
      { title: "Guides — No More Copium" },
      { name: "description", content: "Training guides and knowledge base." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientGuidesPage,
});
