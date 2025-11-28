import { Outlet, useLocation } from "react-router-dom";
import ChatPlaceholder from "@/pages/layout/placeholder/ChatPlaceholder.tsx";
import ChatDetails from "@/components/chats/ChatDetails";
import ChatInterfaceBgImage from "@/components/chats/ChatInterfaceBgImage.tsx";
import { useIsMobile } from "@/hooks/useMobile";
const ChatInterface = () => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile(); // true on mobile, false on desktop
  return (
    <section className="flex-1 h-screen bg-[#F6F7F8]! flex">
      <ChatDetails />
      <main className="flex-1  h-screen relative">
        <ChatInterfaceBgImage />
        {pathname && pathname == "/app/chats" ? (
          !isMobile && (
            <main className="border-l flex-1 h-screen relative w-full">
              <ChatPlaceholder />
            </main>
          )
        ) : (
          <Outlet />
        )}
      </main>
    </section>
  );
};

export default ChatInterface;
