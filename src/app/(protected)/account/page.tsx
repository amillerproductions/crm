import AccountPageView from "@/views/account-page";
import { getAuthenticatedUser } from "@/lib/auth";
import { getAccountCredentials } from "@/lib/crm-data";

type AccountPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    return null;
  }

  const credentials = await getAccountCredentials(user.id);

  return (
    <AccountPageView
      credentials={credentials}
      userEmail={user.email}
      userId={user.id}
      displayName={String(user.user_metadata?.display_name ?? "").trim()}
      createdAt={String(user.created_at ?? "")}
      searchParams={searchParams}
    />
  );
}
