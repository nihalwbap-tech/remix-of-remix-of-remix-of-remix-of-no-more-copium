import { createFileRoute } from "@tanstack/react-router";
import { ClientModuleReaderPage } from "@/components/client/ClientModuleReaderPage";

export const Route = createFileRoute(
  "/client/guides/$guideId/modules/$moduleId",
)({
  head: () => ({
    meta: [
      { title: "Module Reader — No More Copium" },
      { name: "description", content: "Interactive course module reader." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientModuleReaderPage,
});
