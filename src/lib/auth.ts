import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function getAllowedEmail() {
  return (process.env.ALLOWED_EMAIL ?? "").trim().toLowerCase();
}

export async function getServerSupabaseClient(options?: {
  writeCookies?: boolean;
}) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const writeCookies = options?.writeCookies ?? false;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!writeCookies) {
          return;
        }

        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function getAuthenticatedUser() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const allowedEmail = getAllowedEmail();

  if (allowedEmail && user.email.toLowerCase() !== allowedEmail) {
    return null;
  }

  return user;
}
