import { useEffect, useRef } from "react";

import { useParams } from "react-router-dom";
import { fetchMsgsByChatId } from "@/features/message/messageThunks.ts";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetMessages,
  setCurrentChatId,
} from "@/features/message/messageSlice.ts";
import type { IMessage } from "@/types/messageTypes.ts";

const MessageDetails = () => {
  let chatType: "private" | "group" = "private";
  const { chatId } = useParams();
  let newChatId: string | null = null; // default to null
  if (chatId) {
    const ChatIdWithGroupType = chatId.split("-");
    chatType = ChatIdWithGroupType[0] === "group" ? "group" : "private";
    newChatId = ChatIdWithGroupType[1] ?? null;
  }
  const dispatch = useAppDispatch();
  const { messages, page, totalPages, loading } = useAppSelector(
    (state: any) => state.message
  );

  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Load messages when chatId changes
  useEffect(() => {
    if (!newChatId) return;

    dispatch(resetMessages());
    dispatch(setCurrentChatId(newChatId));

    dispatch(
      fetchMsgsByChatId({ chatId: newChatId, page: 1, limit: 20, chatType })
    );
  }, [newChatId, chatType, dispatch]);

  // Infinite scroll – load older messages
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && !loading && page < totalPages) {
      dispatch(
        fetchMsgsByChatId({
          chatId: chatId!,
          page: page + 1,
          limit: 20,
          chatType,
        })
      );
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={messageContainerRef}
      onScroll={handleScroll}
      className="flex flex-col h-full overflow-y-auto p-3"
    >
      {loading && page === 1 && <p>Loading messages...</p>}

      {messages.map((msg: IMessage) => (
        <div key={msg._id} className="py-1 bg-blue-900">
          <p>{msg.content}</p>
        </div>
      ))}

      {loading && page > 1 && <p>Loading more…</p>}
    </div>
  );
};

export default MessageDetails;
