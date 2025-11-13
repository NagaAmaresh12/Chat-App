// ========== MainLayout.tsx (Check for issues) ==========
import SidebarComp from "@/pages/layout/SidebarComp";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <SidebarComp />
        <main className="flex-1 overflow-hidden">
          <SidebarTrigger className="m-2" />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
