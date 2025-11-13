import { Outlet, useLocation } from "react-router-dom";
import UserPlaceholder from "@/pages/layout/interface/UserInterface.tsx";
import UserDetails from "@/components/users/UserDetails.tsx";

const UserInterface = () => {
  const { pathname } = useLocation();
  return (
    <section className="w-full h-screen bg-amber-700">
      <UserDetails />
      {pathname && pathname == "/app/users" ? <UserPlaceholder /> : <Outlet />}
    </section>
  );
};

export default UserInterface;
