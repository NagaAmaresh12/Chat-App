// ============================================================
// 8. Updated ChatListItem with Unread Count
// ============================================================
// src/components/chats/ChatListItem.tsx
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Chat } from "@/types/chatTypes.ts";
import noImage from "@/assets/noImage.jpg";

interface ChatListItemProps {
  chat: Chat;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const chatType = chat.type === "group" ? "group" : "private";
    navigate(`/app/chats/${chatType}-${chat.chatId}`);
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: false });
    } catch {
      return "";
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center p-3 hover:bg-accent cursor-pointer border-b transition-colors"
    >
      <Avatar className="w-12 h-12 flex-shrink-0">
        <AvatarImage src={chat?.chatImage || noImage} />
        <AvatarFallback>
          {chat.chatName?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 ml-3 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold truncate">{chat.chatName}</h3>
          {chat.lastMessage && (
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {getTimeAgo(chat.lastMessageAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate flex-1">
            {chat.lastMessage || "No messages yet"}
          </p>

          {chat.unreadCount > 0 && (
            <Badge
              variant="default"
              className="ml-2 flex-shrink-0 bg-green-600 hover:bg-green-700"
            >
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
