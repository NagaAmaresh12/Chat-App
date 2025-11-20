import { Outlet, useLocation } from "react-router-dom";
import UserPlaceholder from "@/pages/layout/placeholder/MessagePlaceholder";
import UserDetails from "@/components/users/UserDetails.tsx";

const UserInterface = () => {
  const { pathname } = useLocation();
  return (
    <section className="flex-1 h-screen bg-zinc-200 flex ">
      <UserDetails />
      {pathname && pathname == "/app/users" ? <UserPlaceholder /> : <Outlet />}
    </section>
  );
};

export default UserInterface;
