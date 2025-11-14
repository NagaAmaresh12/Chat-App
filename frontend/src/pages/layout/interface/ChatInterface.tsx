import { Outlet, useLocation } from "react-router-dom";
import ChatPlaceholder from "@/pages/layout/placeholder/ChatPlaceholder.tsx";
import ChatDetails from "@/components/chats/ChatDetails";

const ChatInterface = () => {
  const { pathname } = useLocation();
  return (
    <section className="flex-1 h-screen bg-amber-700 flex">
      <ChatDetails />
      <main className="">
        {" "}
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
