import { previewPathPrefix } from "@/lib/preview-path-prefix";

/** Join a Vite base, an optional preview prefix, and a public-file path. */
export function joinPublicPath(base: string, prefix: string, path: string): string {
  const clean = path.replace(/^\/+/, "");
  if (base.startsWith(".")) return `${base}${clean}`;
  const root = `${prefix}${base.startsWith("/") ? base : `/${base}`}`.replace(/\/{2,}/g, "/");
  return `${root.endsWith("/") ? root : `${root}/`}${clean}`;
}

/**
 * URL of a file in /public. Honors Vite's BASE_URL (GitHub Pages project
 * sites use `/repo/`) and the path-based preview prefix.
 */
export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const prefix =
    typeof window === "undefined"
      ? ""
      : (previewPathPrefix(window.location.hostname, window.location.pathname) ?? "");
  return joinPublicPath(base, prefix, path);
}
