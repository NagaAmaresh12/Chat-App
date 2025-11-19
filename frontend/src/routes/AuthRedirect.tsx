// AuthRedirect.tsx
import { useAppSelector } from "@/redux/hooks.ts";
import { Navigate, Outlet } from "react-router-dom";

const AuthRedirect = () => {
  const { currentUser } = useAppSelector((state) => state.user);
  // console.log("id from authredirect", { id });

  return currentUser ? <Navigate to="/home" replace /> : <Outlet />;
};

export default AuthRedirect;
