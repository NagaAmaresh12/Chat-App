import SidebarComp from "@/components/sidebar/SidebarComp";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SidebarComp />
      <main className="flex-1 overflow-hidden bg-amber-600">
        <Outlet />
      </main>
    </div>
  );
}
