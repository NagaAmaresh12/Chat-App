// ========== UserDetails.tsx (Fixed, Typed, Production-Ready) ==========
import { useEffect, useState, useCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllUsers } from "@/features/user/userThunks.ts"; // ✅ Make sure it's users, not chats
import UserListItem from "@/components/users/UserListIem.tsx";
import type { UserProfile } from "@/types/userTypes";

// ========== CONSTANTS ==========
const PAGE_LIMIT = 20;

const UserDetails = () => {
  const dispatch = useAppDispatch();

  const { allUsers, status, hasMore, page } = useAppSelector(
    (state) => state.user
  );
  const loading = status === "loading";

  const [activeTab, setActiveTab] = useState<"all" | "online" | "offline">(
    "all"
  );
  const [search, setSearch] = useState("");

  // ✅ Initial fetch
  useEffect(() => {
    if (!allUsers || allUsers.length === 0) {
      dispatch(fetchAllUsers({ page: 1, limit: PAGE_LIMIT })).unwrap();
    }
  }, [dispatch, allUsers]);

  // ✅ Load more function (memoized to avoid re-renders)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchAllUsers({ page: page + 1, limit: PAGE_LIMIT })).unwrap();
    }
  }, [dispatch, page, hasMore, loading]);

  // ✅ Search & Filter
  console.log("====================================");
  console.log({ allUsers });
  console.log("====================================");
  const filteredUsers = allUsers
    ?.filter((user: UserProfile) =>
      user.username.toLowerCase().includes(search.toLowerCase())
    )
    .filter((user) => {
      if (activeTab === "online") return user.isOnline;
      if (activeTab === "offline") return !user.isOnline;
      return true;
    });
  // ✅ Debug log (remove in production)
  console.log("👤 Users:", allUsers);

  return (
    <section className="h-full w-[30vw] border-r border-zinc-400 px-4 bg-zinc-100 flex flex-col overflow-x-hidden! ">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-semibold">
          Muchhatlu <b className="text-sm my-4">(Users)</b>
        </h1>
      </div>

      {/* Search */}
      <div className="relative p-3">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="px-3 pb-2">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
        >
          <TabsList className="grid grid-cols-3 w-full gap-2">
            <TabsTrigger
              value="all"
              className={activeTab === "all" ? "bg-blue-400 text-blue-900" : ""}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="online"
              className={
                activeTab === "online" ? "bg-blue-400 text-blue-900" : ""
              }
            >
              Online
            </TabsTrigger>
            <TabsTrigger
              value="offline"
              className={
                activeTab === "offline" ? "bg-blue-400 text-blue-900" : ""
              }
            >
              Offline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-hidden">
        {loading && (!allUsers || allUsers.length === 0) ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <Virtuoso
            data={filteredUsers}
            endReached={loadMore}
            overscan={200}
            itemContent={(index, user) => (
              <UserListItem key={user.id} user={user} />
            )} // You may rename ChatListItem -> UserListItem
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
              <p className="text-muted-foreground mb-2">No users found</p>
              <p className="text-sm text-muted-foreground">
                Try searching with a different name.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserDetails;
