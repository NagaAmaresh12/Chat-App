import { useParams } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks.ts";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";

const UserInfoPage = () => {
  const { userId } = useParams<string>();

  // get all users from redux
  const { allUsers } = useAppSelector((state: any) => state.user);
  console.log("is Users exists", { allUsers });

  // find user by id
  const user = allUsers?.find((u: any) => u.id === userId);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        User not found
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center mt-6 px-4">
      {/* Top Banner */}
      <div className="w-full h-62 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-md"></div>

      {/* Avatar */}
      <div className="-mt-12">
        <Avatar className="w-[10vw] h-[10vw] min-w-[80px] min-h-[80px] max-w-[130px] max-h-[130px] border-4 border-white shadow-lg">
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

      {/* Detailed Info Card */}
      <Card className="w-full max-w-xl mt-6 shadow-sm border border-gray-200">
        <CardContent className="space-y-4 py-6">
          {/* Email */}
          <div>
            <Label className="text-gray-500 text-sm">Email</Label>
            <p className="text-lg font-medium">{user.email}</p>
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
