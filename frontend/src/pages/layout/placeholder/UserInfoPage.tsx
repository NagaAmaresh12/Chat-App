import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks.ts";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button";
import { BsChatDots } from "react-icons/bs";
import { BsChatDotsFill } from "react-icons/bs";
import { RiChatNewLine } from "react-icons/ri";
import { FiMessageCircle } from "react-icons/fi";
import { MdChat } from "react-icons/md";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

const UserInfoPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<string>();

  // get all users from redux
  const { allUsers } = useAppSelector((state: any) => state.user);
  const { allChats } = useAppSelector((state: any) => state.chat);
  console.log("is Users exists", { allUsers });

  // find user by id
  const user = allUsers?.find((u: any) => u.id === userId);
  console.log({ user });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        User not found
      </div>
    );
  }
  const startChat = () => {
    //get the newUser id
    //check does chat exists before
    if (allChats) {
      const isExists = allChats.find(
        (chat: any) => chat.chatName == user.userName
      );
      console.log("does chat exists", { isExists });
      if (isExists) {
        return;
      } else {
        //create new chat
      }
    } else {
      //return no chats found
      console.log("No chats founds", { allChats });
    }
    //redirect user to /app/chats/:chatId
    navigate(`/app/chats/${user.userId}`);
  };
  return (
    <div className="w-full h-screen flex flex-col items-center mt-6 px-4 relative z-2 ">
      {/* Top Banner */}
      <div className="w-full h-62 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-md"></div>

      {/* Avatar */}
      <div className="-mt-12">
        <Avatar className=" min-w-20 min-h-20 max-w-[130px] max-h-[130px] border-4 border-white shadow-lg">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className="text-xl bg-gray-200">
            {user.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Basic User Info */}
      <div className="text-center mt-4">
        <h2 className="text-2xl font-semibold">{user.username}</h2>

        <Badge
          className={`mt-2 ${
            user.isOnline ? "bg-green-500" : "bg-gray-400"
          } text-white`}
        >
          {user.isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      <div className="flex sm-flex-row md-flex-col h-[4vw] w-1/2 sm-w-full justify-between items-center border px-2 rounded-2xl my-10">
        {" "}
        <p className="text-zinc-400! break-all">
          Start a new Conversation...Let's Ping
        </p>
        <Button
          variant={"secondary"}
          className="bg-custom-bg-1! px-2 m-2 text-white rounded-full! h-8 w-24!"
          onClick={startChat}
        >
          Ping <BsChatDots />
        </Button>
      </div>

      {/* Detailed Info Card */}
      <Card className="w-full max-w-2xl mt-6 shadow-sm border border-gray-200">
        <CardContent className="space-y-4 py-6">
          {/* Email */}
          <div>
            <Label className="text-gray-500 text-sm ">Email</Label>
            <p className="text-lg font-medium break-all">{user.email} </p>
          </div>

          {/* Bio */}
          <div>
            <Label className="text-gray-500 text-sm">Bio</Label>
            <p className="text-base">{user.bio || "No bio provided."}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInfoPage;
