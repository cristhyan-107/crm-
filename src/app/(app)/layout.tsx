import { getAuthUser } from '@/lib/auth/get-user';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto bg-background/50 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
