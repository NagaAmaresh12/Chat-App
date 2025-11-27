import { Outlet, useLocation } from "react-router-dom";
import ChatPlaceholder from "@/pages/layout/placeholder/ChatPlaceholder.tsx";
import ChatDetails from "@/components/chats/ChatDetails";
import ChatInterfaceBgImage from "@/components/chats/ChatInterfaceBgImage.tsx";
const ChatInterface = () => {
  const { pathname } = useLocation();
  return (
    <section className="flex-1 h-screen bg-[#F6F7F8]! flex">
      <ChatDetails />
      <main className="flex-1  h-screen relative">
        <ChatInterfaceBgImage />
        {pathname && pathname == "/app/chats" ? (
          <ChatPlaceholder />
        ) : (
          <Outlet />
        )}
      </main>
    </section>
  );
};

export default ChatInterface;
