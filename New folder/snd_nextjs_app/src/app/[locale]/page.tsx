import DashboardPage from '@/app/page';

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Render the home page dashboard
  return <DashboardPage />;
}
