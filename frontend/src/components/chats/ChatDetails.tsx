// ========== ChatDetails.tsx with react-virtuoso ==========
// npm install react-virtuoso

import { Virtuoso } from "react-virtuoso";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchChatsPage } from "@/features/chat/chatThunks";
import ChatListItem from "@/components/chats/ChatListItem";
import { useIsMobile } from "@/hooks/useMobile";
import { useLocation } from "react-router-dom";
import { join_my_rooms } from "@/services/socket/events/roomEvents";
import { useEffect, useRef, useState } from "react";

const PAGE_LIMIT = 20;

interface Chat {
  id: string;
  chatName?: string;
  type?: "group" | "private";
  unreadCount?: number;
  [key: string]: any;
}

const ChatDetails = () => {
  const { pathname } = useLocation();

  const isMobile = useIsMobile(); // true on mobile, false on desktop
  const dispatch = useAppDispatch();
  const { chats, loading, page, hasMore } = useAppSelector(
    (state: any) => state.chat
  );

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const initialFetchDone = useRef(false);

  // Initial fetch
  // useEffect(() => {
  //   if (!chats || chats.length === 0) {
  //     dispatch(fetchChatsPage({ page: 1, limit: PAGE_LIMIT }));
  //     join_my_rooms();
  //   }
  // }, [dispatch, chats]);
  useEffect(() => {
    if (initialFetchDone.current) return;

    initialFetchDone.current = true;
    dispatch(fetchChatsPage({ page: 1, limit: PAGE_LIMIT }));
    join_my_rooms();
  }, [dispatch]);
  const loadMore = () => {
    if (loading) return;
    if (!hasMore) return;

    dispatch(fetchChatsPage({ page: page + 1, limit: PAGE_LIMIT }));
  };

  // Filter chats
  const filteredChats = (chats || []).filter((chat: Chat) =>
    chat.chatName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredByTab = filteredChats.filter((chat: Chat) => {
    if (activeTab === "groups") return chat.type === "group";
    if (activeTab === "unread") return (chat.unreadCount || 0) > 0;
    return true;
  });

  console.log("====================================");
  console.log({ chats });
  console.log("====================================");
  return (
    <section
      className={`h-full ${
        isMobile
          ? pathname.startsWith("/app/chats/group") ||
            pathname.startsWith("/app/chats/private")
            ? " w-0! "
            : "w-full"
          : "w-[22vw]"
      }border-r  flex flex-col`}
    >
      {/* Header */}
      <div className="py-8! px-4! border-b">
        <h1 className="text-[28px]! font-bold text-custom-bg-1! ">
          Muchhatlu <span className="text-sm my-4">(Chats)</span>
        </h1>
      </div>
      {/* Search */}
      <div className="relative p-3">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <Input
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="px-3 pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 gap-3 w-full h-10! bg-transparent!">
            <TabsTrigger
              value="all"
              className={
                activeTab == "all"
                  ? "bg-custom-bg-1! text-white! border-none! outline-none! rounded-full! h-8! text-xs! w-24!"
                  : "bg-white! text-zinc-500! hover:border-zinc-500!  border-zinc-200! outline-none! rounded-full! h-8! text-xs!  w-24! "
              }
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className={
                activeTab == "groups"
                  ? "bg-custom-bg-1! text-white! border-none! outline-none! rounded-full! h-8! text-xs!  w-24!"
                  : "bg-white! text-zinc-500! border-zinc-200! outline-none! rounded-full! h-8! text-xs! hover:border-zinc-500! w-24! "
              }
            >
              Groups
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className={
                activeTab == "unread"
                  ? "bg-custom-bg-1! text-white! border-none! outline-none! rounded-full! h-8! text-xs!  w-24!"
                  : "bg-white! text-zinc-500! hover:border-zinc-500!  border-zinc-200! outline-none! rounded-full! h-8! text-xs!  w-24! "
              }
            >
              Unread
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chat List with Virtuoso */}
      <div className="flex-1 overflow-hidden">
        {loading && (!chats || chats.length === 0) ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading chats...</p>
          </div>
        ) : filteredByTab.length > 0 ? (
          <Virtuoso
            data={filteredByTab}
            endReached={loadMore}
            increaseViewportBy={200}
            itemContent={(index, chat) => (
              <ChatListItem key={chat.chatId} chat={chat} />
            )}
            components={{
              Footer: () =>
                loading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Loading more...
                    </p>
                  </div>
                ) : null,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No chats found</p>
              <p className="text-sm text-muted-foreground">
                Start a new conversation!
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatDetails;
