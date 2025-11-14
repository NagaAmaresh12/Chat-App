import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BellOff, Pin } from "lucide-react";
import type { Chat } from "@/types/chatTypes";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

const ChatListItem = ({ chat }: { chat: Chat }) => {
  return (
    <Button
      asChild
      className={cn(
        "flex items-center gap-3 w-[22vw] h-20 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors bg-amber-600 my-5 mx-3"
      )}
    >
      <Link to={`${chat?.type}-${chat?.chatId}`}>
        {/* Avatar */}
        <Avatar className="w-12 h-12">
          <AvatarImage
            src={chat.chatImage || "/default-avatar.png"}
            alt={chat.chatName}
          />
          <AvatarFallback>{chat.chatName.charAt(0)}</AvatarFallback>
        </Avatar>

        {/* Chat info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm truncate">{chat.chatName}</h4>

            <div className="flex items-center gap-1">
              {/* Pinned */}
              {chat.isPinned && <Pin className="w-4 h-4 text-gray-400" />}
              {/* Muted */}
              {chat.isMuted && <BellOff className="w-4 h-4 text-gray-400" />}
              {/* Last message time */}
              <span className="text-xs text-gray-400">
                {chat.time || "Now"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            {/* Last message */}
            <p className="text-xs text-gray-500 truncate">
              {chat.lastMessage || "No messages yet"}
            </p>

            {/* Unread badge */}
            {chat.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1 py-0.5">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </Button>
  );
};

export default ChatListItem;
