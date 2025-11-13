// ========== ChatDetails.tsx with react-virtuoso ==========
// npm install react-virtuoso

import { useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchChatsPage } from "@/features/chat/chatThunks";
import ChatListItem from "@/components/chats/ChatListItem";

const PAGE_LIMIT = 20;

interface Chat {
  id: string;
  chatName?: string;
  type?: "group" | "private";
  unreadCount?: number;
  [key: string]: any;
}

const ChatDetails = () => {
  const dispatch = useAppDispatch();
  const { chats, loading, page, hasMore } = useAppSelector(
    (state: any) => state.chat
  );

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // Initial fetch
  useEffect(() => {
    if (!chats || chats.length === 0) {
      dispatch(fetchChatsPage({ page: 1, limit: PAGE_LIMIT }));
    }
  }, [dispatch]);

  // Filter chats
  const filteredChats = (chats || []).filter((chat: Chat) =>
    chat.chatName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredByTab = filteredChats.filter((chat: Chat) => {
    if (activeTab === "groups") return chat.type === "group";
    if (activeTab === "unread") return (chat.unreadCount || 0) > 0;
    return true;
  });

  // Load more function
  const loadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchChatsPage({ page: page + 1, limit: PAGE_LIMIT }));
    }
  };
  console.log("====================================");
  console.log({ chats });
  console.log("====================================");
  return (
    <section className="h-full w-1/4 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-semibold">Mucchatlu</h1>
      </div>

      {/* Search */}
      <div className="relative p-3">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
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
            overscan={200}
            itemContent={(index, chat) => <ChatListItem chat={chat} />}
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
