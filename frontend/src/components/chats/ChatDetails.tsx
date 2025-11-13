import { useParams } from "react-router-dom";

const ChatDetails = () => {
  const { chatId } = useParams();
  return <div>Now chatting with ID: {chatId}</div>;
};

export default ChatDetails;
