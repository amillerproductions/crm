import FinancePageView from "@/views/finance-page";

type FinancePageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: string;
  }>;
};

export default function FinancePage({ searchParams }: FinancePageProps) {
  return <FinancePageView searchParams={searchParams} />;
}
