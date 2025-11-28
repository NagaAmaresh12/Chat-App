import { addNewMessage } from "@/features/message/messageSlice";
import { getSocket } from "@/services/socket/socketClientFile";
import type { IMessage } from "@/types/messageTypes.ts";
import { store } from "@/redux/store.ts";
import type { SendMessagePayload } from "@/types/socketTypes.ts";

// Send a message to the server
export function sendMessage(payload: SendMessagePayload) {
  const socket = getSocket();
  if (!socket) return; // safety check
  const newPayload: IMessage = {
    _id: "123",
    chatId: payload.chatId!,
    chatType: payload.chatType!,
    senderId: payload.id!,
    content: payload.content!,
    messageType: payload.messageType!,
    attachments: payload.attachments || [],
    isDeleted: false,
    readBy: [],
    deliveredTo: [],
    reactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    sender: {
      // _id: payload.sender._id,
      // username: payload.sender.username,
      // email: payload.sender.email,
      // bio: payload.sender.bio,
      // avatar: payload.sender.avatar,
      // displayname:payload.sender.displayname,
      // blockedUsers:payload.sender.blockedUsers,
      // isOnline:payload.sender.isOnline,
      _id: payload.id!,
      username: "osgsbs",
      email: "osgsbs",
      bio: "osgsbs",
      avatar: "osgsbs",
      displayname: "osgsbs",
      blockedUsers: [],
      isOnline: true,
    },
  };
  console.log("Sending message payload", payload);
  // Update Redux immediately (optimistic UI)
  store.dispatch(addNewMessage(newPayload));
  socket.emit("send-message", payload);
}

// Subscribe to new messages from the server
export function subscribeToNewMessages(handler: (msg: IMessage) => void) {
  const socket = getSocket();
  if (!socket) return () => {}; // safety check

  // Wrapped handler to extract `data` from backend response
  const wrappedHandler = (serverData: {
    success: boolean;
    message: string;
    data: IMessage;
  }) => {
    handler(serverData.data);
  };

  socket.on("new-message", wrappedHandler);

  // Cleanup function
  return () => socket.off("new-message", wrappedHandler);
}
