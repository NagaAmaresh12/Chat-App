// ============================================================
// 7. Message Input Component with Typing Indicators
// ============================================================
// src/components/messages/MessageInput.tsx
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { socketService } from "@/services/socketService";
import { useAppSelector } from "@/redux/hooks";

interface MessageInputProps {
  chatId: string;
  chatType: "private" | "group";
}

const MessageInput: React.FC<MessageInputProps> = ({ chatId, chatType }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAppSelector((state: any) => state.auth);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(chatId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.stopTyping(chatId);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(chatId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Send message via socket
    socketService.sendMessage({
      chatId,
      content: message.trim(),
      messageType: "text",
      attachments: [],
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        socketService.stopTyping(chatId);
      }
    };
  }, [chatId, isTyping]);

  return (
    <div className="border-t p-4 bg-background">
      <div className="flex items-end space-x-2">
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Paperclip className="w-5 h-5" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="min-h-[44px] max-h-[120px] resize-none"
          rows={1}
        />

        <Button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
