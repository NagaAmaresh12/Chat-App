// MessageItem.tsx
import { Badge } from "@/components/ui/badge.tsx";
import { useAppSelector } from "@/redux/hooks";
import type { IMessage } from "@/types/messageTypes.ts";

const MessageItem = ({
  msg,
  showDayLabel,
  dayLabel,
}: {
  msg: IMessage;
  showDayLabel?: boolean;
  dayLabel?: string;
}) => {
  console.log({ msg, username: msg.sender.username });

  const { id } = useAppSelector((state) => state.auth);
  const isOwnMessage = id && msg.senderId === id;
  const createdAt = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    second: undefined, // explicitly remove seconds
  }).format(new Date(msg.createdAt));
  console.log({ createdAt });

  return (
    <div className="w-full relative z-2">
      {/* Day label - only show if specified */}
      {showDayLabel && dayLabel && (
        <div className="flex justify-center my-3">
          <Badge
            variant="secondary"
            className="text-xs px-3 py-1 bg-white text-zinc-400 hover:none text-[10px]"
          >
            {dayLabel}
          </Badge>
        </div>
      )}

      {/* Message bubble container */}
      <div
        className={`w-full flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } px-2 mb-1`}
      >
        <div className="py-1 w-fit max-w-[70%] ">
          <div
            className={`${
              isOwnMessage
                ? "bg-custom-bg-1 text-white"
                : "bg-white text-zinc-500 "
            } rounded-lg px-3 py-2 break-words shadow-md`}
          >
            {/* Sender name for group chats (if not own message) */}
            {!isOwnMessage && msg.sender && (
              <p className="text-xs font-semibold text-custom-bg-1! mb-1">
                {msg?.sender?.username || "Unkown"}
              </p>
            )}

            <p className="text-sm">{msg.content}</p>

            {/* Timestamp */}
            <span className="text-[10px] text-zinc-500! float-right   ml-2 mt-2">
              {createdAt}
            </span>
          </div>

          {/* Attachments if any */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-1 space-y-1">
              {msg.attachments.map((att) => (
                <img
                  key={att._id}
                  src={att.url}
                  alt={att.filename}
                  className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(att.url, "_blank")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
