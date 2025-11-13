// ========== ChatsView.tsx (FIXED) ==========
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import ChatLists from "@/components/chat/ChatsList.tsx";
import ChatInterface from "@/pages/layout/ChatInterface";
import { useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";

const ChatsView = () => {
  const { chatId } = useParams();

  // ✅ No Navigate components that could cause loops
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-full">
      {/* Chat Lists */}
      <ResizablePanel
        defaultSize={30}
        minSize={25}
        maxSize={40}
        className="border-r"
      >
        <ChatLists selectedChatId={chatId} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Chat Messages */}
      <ResizablePanel defaultSize={70}>
        {chatId ? (
          <ChatInterface chatId={chatId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold">Select a chat</h3>
              <p className="text-sm">
                Choose a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ChatsView;
