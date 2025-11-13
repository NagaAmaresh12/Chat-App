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

  return (
    <aside className="w-16 h-full flex flex-col items-center justify-between bg-background border-r">
      <nav className="flex flex-col items-center py-4 space-y-4 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.url);
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              to={item.url}
              title={item.title}
              className={cn(
                "flex justify-center items-center w-full h-12 rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              {item && item?.title !== "Profile" ? (
                <Icon className="w-6 h-6" />
              ) : (
                <Avatar>
                  <AvatarImage src={item?.url} alt="@shadcn" />
                  <AvatarFallback>
                    {user ? (
                      user?.name.charAt(0).toUpperCase()
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </AvatarFallback>
                </Avatar>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SidebarComp;
