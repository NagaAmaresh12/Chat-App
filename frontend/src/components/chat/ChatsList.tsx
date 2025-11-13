import { useAppSelector } from "@/redux/hooks.ts";

const ChatList = () => {
  const { chats } = useAppSelector((state) => state?.chat);

  return (
    <ul>
      {chats.map((chat) => (
        <li key={chat.chatId} className="p-4 hover:bg-gray-100 cursor-pointer">
          {chat.chatId}
        </li>
      ))}
    </ul>
  );
};

export default ChatList;
