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
      className="flex items-center p-3 hover:bg-[#3A6EA5]/10 cursor-pointer border-b transition-colors w-full"
    >
      <NavLink
        to={user.id!}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 w-[20vw] h-18  cursor-pointer transition-colors px-3 py-2 bg-transparent",

            isActive
              ? "bg-red-500 text-white"
              : "bg-amber-600 hover:bg-amber-200"
          )
        }
      >
        <Avatar className="w-12 h-12 border-[#3A6EA5]! border! bg-transparent!">
          <AvatarImage
            src={user.avatar || "/default-avatar.png"}
            alt={user.username!}
            className="w-12 h-12  "
          />
          <AvatarFallback>
            <span className="text-zinc-500!">{user.username?.charAt(0)}</span>
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 ml-3 min-w-0">
          <h3 className="font-medium text-md! truncate text-[#3A6EA5]!">
            {user.username}
          </h3>
          <p className="text-xs text-zinc-400! py-2! truncate">
            {user.isOnline ? "Active" : "Offline"}
          </p>
        </div>
      </NavLink>
    </Button>
  );
};

export default UserListItem;
