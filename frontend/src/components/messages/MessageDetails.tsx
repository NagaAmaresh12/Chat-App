// ============================================================
// 5. Updated MessageDetails.tsx with Socket Integration
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMsgsByChatId } from "@/features/message/messageThunks.ts";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import {
  resetMessages,
  setCurrentChatId,
  clearTypingUsers,
} from "@/features/message/messageSlice.ts";
import { resetUnreadCount } from "@/features/chat/chatSlice.ts";
import type { IMessage } from "@/types/messageTypes.ts";
import MessageItem from "@/features/message/MessageItem.tsx";
import {
  getMessageDayLabel,
  getDateLabelSortValue,
} from "@/utils/DateGroupFormate";
import { socketService } from "@/services/socket/socketService.ts";
import TypingIndicator from "@/components/messages/TypingIndicator.tsx";

const MessageDetails = () => {
  let chatType: "private" | "group" = "private";
  const { chatId } = useParams();
  let newChatId: string | null = null;

  if (chatId) {
    const ChatIdWithGroupType = chatId.split("-");
    chatType = ChatIdWithGroupType[0] === "group" ? "group" : "private";
    newChatId = ChatIdWithGroupType[1] ?? null;
  }

  const dispatch = useAppDispatch();
  const { messages, page, hasMore, loading, typingUsers } = useAppSelector(
    (state: any) => state.message
  );
  const { user } = useAppSelector((state: any) => state.auth);

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const previousScrollHeight = useRef(0);
  const isLoadingMore = useRef(false);
  const prevChatIdRef = useRef<string | null>(null);

  // Load messages when chatId changes
  useEffect(() => {
    if (!newChatId) return;

    // Leave previous chat room
    if (prevChatIdRef.current && prevChatIdRef.current !== newChatId) {
      socketService.leaveChat(prevChatIdRef.current);
      dispatch(clearTypingUsers(prevChatIdRef.current));
    }

    setIsInitialLoad(true);
    dispatch(resetMessages());
    dispatch(setCurrentChatId(newChatId));
    dispatch(resetUnreadCount(newChatId));

    // Join new chat room
    socketService.joinChat(newChatId);

    dispatch(
      fetchMsgsByChatId({ chatId: newChatId, page: 1, limit: 20, chatType })
    );

    prevChatIdRef.current = newChatId;
  }, [newChatId, chatType, dispatch]);

  // Scroll to bottom on initial load or new messages
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    if (isInitialLoad && messages.length > 0) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
        setIsInitialLoad(false);
      }, 100);
    } else if (!isLoadingMore.current && !isInitialLoad) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      if (isNearBottom) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      }
    }
  }, [messages, isInitialLoad]);

  // Handle scroll to load older messages
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;

    if (
      container.scrollTop < 100 &&
      !loading &&
      hasMore &&
      !isLoadingMore.current
    ) {
      isLoadingMore.current = true;
      previousScrollHeight.current = container.scrollHeight;

      dispatch(
        fetchMsgsByChatId({
          chatId: newChatId!,
          page: page + 1,
          limit: 20,
          chatType,
        })
      ).then(() => {
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const scrollDifference =
              newScrollHeight - previousScrollHeight.current;
            container.scrollTop = scrollDifference;
          }
          isLoadingMore.current = false;
        }, 100);
      });
    }
  };

  // Group messages by day
  const groupedMessages = messages.reduce(
    (acc: Record<string, IMessage[]>, msg: IMessage) => {
      const dayLabel = getMessageDayLabel(msg.createdAt);
      if (!acc[dayLabel]) acc[dayLabel] = [];
      acc[dayLabel].push(msg);
      return acc;
    },
    {}
  );

  const sortedDays = Object.keys(groupedMessages).sort((a, b) => {
    const dateA = groupedMessages[a][0]?.createdAt;
    const dateB = groupedMessages[b][0]?.createdAt;
    return getDateLabelSortValue(dateA) - getDateLabelSortValue(dateB);
  });

  sortedDays.forEach((day) => {
    groupedMessages[day].sort(
      (a, b) =>
        getDateLabelSortValue(a.createdAt) - getDateLabelSortValue(b.createdAt)
    );
  });

  // Get typing users for current chat
  const currentTypingUsers = (typingUsers[newChatId || ""] || []).filter(
    (u) => u.userId !== user?.id
  );

  return (
    <div className="flex flex-col h-full">
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-2"
      >
        {loading && hasMore && messages.length > 0 && (
          <div className="text-center text-gray-400 py-2 text-sm">
            Loading older messages...
          </div>
        )}

        {sortedDays.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full text-center text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          sortedDays.map((day) => (
            <div key={day}>
              {groupedMessages[day].map((msg: IMessage, index: number) => (
                <MessageItem
                  key={msg._id}
                  msg={msg}
                  showDayLabel={index === 0}
                  dayLabel={day}
                />
              ))}
            </div>
          ))
        )}

        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-gray-400">
            Loading messages...
          </div>
        )}

        {/* Typing Indicator */}
        {currentTypingUsers.length > 0 && (
          <TypingIndicator users={currentTypingUsers} />
        )}
      </div>
    </div>
  );
};

export default MessageDetails;
