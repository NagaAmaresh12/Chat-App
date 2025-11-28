import { MessageSquare, Users, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AvatarFallback,
  AvatarImage,
  Avatar,
} from "@/components/ui/avatar.tsx";
import { useAppSelector } from "@/redux/hooks";

const navItems = [
  { title: "Chats", url: "/app/chats", icon: MessageSquare },
  { title: "Users", url: "/app/users", icon: Users },
  { title: "Profile", url: "/app/profile", icon: User },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

const SidebarComp = () => {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const topItems = navItems.slice(0, 3);
  const bottomItem = navItems[3];

  return (
    <aside className="w-16 h-full flex flex-col items-center border-r">
      {/* Top Section */}
      <nav className="flex flex-col items-center py-4 space-y-4 w-full  h-full">
        {topItems.map((item) => {
          const isActive = location.pathname.startsWith(item.url);
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              to={item.url}
              title={item.title}
              className={cn(
                "flex justify-center items-center w-full h-12 rounded-lg transition-colors text-custom-bg-1",
                "hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              {item.title !== "Profile" ? (
                <Icon className="w-6 h-6 text-custom-bg-1" />
              ) : (
                <Avatar>
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    <span className="text-custom-bg-1">
                      {user ? user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </AvatarFallback>
                </Avatar>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section (Settings) */}
      <div className="pb-4 w-full">
        <Link
          to={bottomItem.url}
          title={bottomItem.title}
          className={cn(
            "flex justify-center items-center w-full h-12 rounded-lg transition-colors text-custom-bg-1",
            location.pathname.startsWith(bottomItem.url) &&
              "bg-accent text-accent-foreground"
          )}
        >
          <bottomItem.icon className="w-6 h-6 text-custom-bg-1" />
        </Link>
      </div>
    </aside>
  );
};

export default SidebarComp;
