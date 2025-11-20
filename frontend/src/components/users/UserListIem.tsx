import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import type { UserProfile } from "@/types/userTypes.ts";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";

const UserListItem = ({ user }: { user: UserProfile }) => {
  return (
    <Button
      asChild
      variant="ghost"
      className="w-full p-0 m-0 bg-transparent bg-red-400 shadow shadow-2xl my-2"
    >
      <NavLink
        to={user.id}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 w-[20vw] h-18 rounded-lg cursor-pointer transition-colors px-3 py-2 bg-transparent",

            isActive
              ? "bg-red-500 text-white"
              : "bg-amber-600 hover:bg-amber-200"
          )
        }
      >
        <Avatar className="w-12 h-12 bg-transparent">
          <AvatarImage
            src={user.avatar || "/default-avatar.png"}
            alt={user.username}
          />
          <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{user.username}</h4>
          <p className="text-xs text-gray-200 truncate">
            {user.isOnline ? "Active" : "Offline"}
          </p>
        </div>
      </NavLink>
    </Button>
  );
};

export default UserListItem;
