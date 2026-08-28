import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/client/guides")({
  component: Outlet,
});
