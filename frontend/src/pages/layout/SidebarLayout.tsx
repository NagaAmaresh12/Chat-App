// ========== SideBarLayout.tsx (FIXED) ==========
import { SidebarTrigger } from "@/components/ui/sidebar";
import SidebarComp from "@/pages/layout/SidebarComp";
import { Outlet } from "react-router-dom";

// ✅ Fixed: Component name starts with capital letter
export default function SideBarLayout() {
  return (
    <div className="flex h-screen w-full">
      {/* ✅ Fixed: Only render SidebarComp once */}
      <SidebarComp />

      <main className="flex-1 overflow-auto">
        {/* ✅ Trigger to open/close sidebar */}
        <div className="p-4">
          <SidebarTrigger />
        </div>

        {/* ✅ Render child routes here */}
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
