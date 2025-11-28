import { Outlet, useLocation } from "react-router-dom";
import UserPlaceholder from "@/pages/layout/placeholder/MessagePlaceholder";
import UserDetails from "@/components/users/UserDetails.tsx";
import { useIsMobile } from "@/hooks/useMobile";

const UserInterface = () => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile(); // true on mobile, false on desktop
  return (
    <section className="flex-1 h-screen bg-[#F6F7F8]! flex ">
      <UserDetails />
      <main className="flex-1  h-screen relative">
        {/* <ChatInterfaceBgImage /> */}
        {pathname && pathname == "/app/users" ? (
          !isMobile && (
            <main className="border-l flex-1 h-screen relative w-full">
              <UserPlaceholder />
            </main>
          )
        ) : (
          <Outlet />
        )}
      </main>
    </section>
  );
};

export default UserInterface;
