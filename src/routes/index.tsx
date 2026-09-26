import { createFileRoute } from "@tanstack/react-router";
import { CommandCenter } from "@/components/command-center";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Autonomous AI Data Engineer" },
      { name: "description", content: "Monitor enterprise data pipelines, autonomous recovery, infrastructure health, and governed AI operations." },
      { property: "og:title", content: "Command Center — Autonomous AI Data Engineer" },
      { property: "og:description", content: "A private control plane for production pipelines, deterministic validation, and autonomous recovery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});