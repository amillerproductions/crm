import HomePageView from "@/views/home-page";

type ProtectedHomePageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default function ProtectedHomePage({
  searchParams,
}: ProtectedHomePageProps) {
  return <HomePageView searchParams={searchParams} />;
}
