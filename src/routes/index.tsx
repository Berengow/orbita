import { createFileRoute } from "@tanstack/react-router";
import { Builder } from "@/components/builder/Builder";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Builder />;
}
