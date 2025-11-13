// ========== SidebarComp.tsx (Icon Navigation) ==========
import { MessageSquare, Users, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  id: number;
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: 1,
    title: "Chats",
    url: "/app/chats",
    icon: MessageSquare,
  },
  {
    id: 2,
    title: "Users",
    url: "/app/users",
    icon: Users,
  },
  {
    id: 3,
    title: "Profile",
    url: "/app/profile",
    icon: User,
  },
  {
    id: 4,
    title: "Settings",
    url: "/app/settings",
    icon: Settings,
  },
];

const SidebarComp = () => {
  const location = useLocation();

  return (
    <nav className="flex flex-col items-center gap-4 py-4 h-full">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.url);

        return (
          <Link
            key={item.id}
            to={item.url}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground"
            )}
            title={item.title}
          >
            <Icon className="w-6 h-6" />
          </Link>
        );
      })}
    </nav>
  );
};

export default SidebarComp;
