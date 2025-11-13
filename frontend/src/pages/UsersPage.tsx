import ChatLayout from "@/pages/layout/ChatLayout.tsx";
import ChatList from "@/components/chat/ChatsList"; // You can reuse for user list
import ChatWindow from "@/components/"; // Shows user info

const UsersPage = () => {
  return (
    <ChatLayout leftContent={<ChatList />} rightContent={<ChatWindow />} />
  );
};

export default UsersPage;
