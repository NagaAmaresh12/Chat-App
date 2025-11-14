//  MessageDetails.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMsgsByChatId } from "@/features/message/messageThunks.ts";
import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import {
  resetMessages,
  setCurrentChatId,
} from "@/features/message/messageSlice.ts";
import type { IMessage } from "@/types/messageTypes.ts";
import MessageItem from "@/features/message/MessageItem.tsx";
import {
  getMessageDayLabel,
  getDateLabelSortValue,
} from "@/utils/DateGroupFormate";

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
  const { messages, page, hasMore, loading } = useAppSelector(
    (state: any) => state.message
  );

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const previousScrollHeight = useRef(0);
  const isLoadingMore = useRef(false);

  // Load messages when chatId changes
  useEffect(() => {
    if (!newChatId) return;

    setIsInitialLoad(true);
    dispatch(resetMessages());
    dispatch(setCurrentChatId(newChatId));

    dispatch(
      fetchMsgsByChatId({ chatId: newChatId, page: 1, limit: 20, chatType })
    );
  }, [newChatId, chatType, dispatch]);

  // Scroll to bottom on initial load or new messages
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    if (isInitialLoad && messages.length > 0) {
      // Initial load - scroll to bottom
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
        setIsInitialLoad(false);
      }, 100);
    } else if (!isLoadingMore.current && !isInitialLoad) {
      // New message arrived - scroll to bottom
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, isInitialLoad]);

  // Handle scroll to load older messages
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;

    // Check if scrolled to top
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
        // Maintain scroll position after loading older messages
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

  // Group messages by day and sort oldest to newest (WhatsApp style)
  const groupedMessages = messages.reduce(
    (acc: Record<string, IMessage[]>, msg: IMessage) => {
      const dayLabel = getMessageDayLabel(msg.createdAt);
      if (!acc[dayLabel]) acc[dayLabel] = [];
      acc[dayLabel].push(msg);
      return acc;
    },
    {}
  );

  // Sort days from oldest to newest
  const sortedDays = Object.keys(groupedMessages).sort((a, b) => {
    const dateA = groupedMessages[a][0]?.createdAt;
    const dateB = groupedMessages[b][0]?.createdAt;
    return getDateLabelSortValue(dateA) - getDateLabelSortValue(dateB);
  });

  // Sort messages within each day from oldest to newest
  sortedDays.forEach((day) => {
    groupedMessages[day].sort(
      (a, b) =>
        getDateLabelSortValue(a.createdAt) - getDateLabelSortValue(b.createdAt)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-2"
      >
        {/* Loading indicator at top */}
        {loading && hasMore && messages.length > 0 && (
          <div className="text-center text-gray-400 py-2 text-sm">
            Loading older messages...
          </div>
        )}

        {/* Messages grouped by day */}
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

        {/* Initial loading */}
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-gray-400">
            Loading messages...
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageDetails;
