import { Outlet, useLocation } from "react-router-dom";
import UserPlaceholder from "@/pages/layout/placeholder/MessagePlaceholder";
import UserDetails from "@/components/users/UserDetails.tsx";
import ChatInterfaceBgImage from "@/components/chats/ChatInterfaceBgImage";

const UserInterface = () => {
  const { pathname } = useLocation();
  return (
    <section className="flex-1 h-screen bg-[#F6F7F8]! flex ">
      <UserDetails />
      <main className="flex-1  h-screen relative">
        {/* <ChatInterfaceBgImage /> */}
        {pathname && pathname == "/app/users" ? (
          <UserPlaceholder />
        ) : (
          <Outlet />
        )}
      </main>
    </section>
  );
};

export default UserInterface;
