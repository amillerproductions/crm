import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function redirectWithFeedback(options: {
  fallbackPath?: string;
  message: string;
  path?: string;
  type?: "success" | "error";
}) {
  const { fallbackPath = "/", message, path, type = "success" } = options;
  const referer = path ? null : (await headers()).get("referer");
  const url = new URL(
    path ? `http://localhost:3000${path}` : referer ?? `http://localhost:3000${fallbackPath}`,
  );

  url.searchParams.set("message", message);
  url.searchParams.set("type", type);

  redirect(`${url.pathname}${url.search}`);
}

export function getFeedbackFromSearchParams(
  searchParams?: { message?: string; type?: string },
) {
  return {
    message: searchParams?.message,
    type: searchParams?.type,
  };
}
