import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BellOff, Pin } from "lucide-react";

import type { UserProfile } from "@/types/userTypes.ts";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

const UserListItem = ({ user }: { user: UserProfile }) => {
  return (
    <Button
      asChild
      className={cn(
        "flex items-center gap-3 h-18 w-[22vw] rounded-lg cursor-pointer hover:bg-amber-100 transition-colors bg-amber-600 my-5 mx-3"
      )}
    >
      <Link to={user?.id} className="flex items-center justify-between  gap-2">
        {/* Avatar */}
        <Avatar className="w-12 h-12 ">
          <AvatarImage
            src={user?.avatar || "/default-avatar.png"}
            alt={user?.username}
          />
          <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
        </Avatar>

        {/* Chat info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm truncate">{user?.username}</h4>

            <div className="flex items-center gap-1">{/* Pinned */}</div>
          </div>

          <div className="flex items-center justify-between mt-1">
            {/* Last message */}
            <p className="text-xs text-gray-500 truncate">
              {user.isOnline ? "Active" : "Offline"}
            </p>
          </div>
        </div>
      </Link>
    </Button>
  );
};

export default UserListItem;
