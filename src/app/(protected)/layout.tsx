import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    redirect("/login");
  }

  return (
    <AppShell
      userEmail={user.email}
      userDisplayName={String(user.user_metadata?.display_name ?? "").trim()}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
