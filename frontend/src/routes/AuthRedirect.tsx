// AuthRedirect.tsx
import { useAppSelector } from "@/redux/hooks";
import { Navigate, Outlet } from "react-router-dom";

const AuthRedirect = () => {
  const { user } = useAppSelector((state) => state.auth);
  return user ? <Navigate to="/home" replace /> : <Outlet />;
};

export default AuthRedirect;
