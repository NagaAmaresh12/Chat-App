import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks.ts";

const ProtectedRoute = () => {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  // If user is not logged in → redirect
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Otherwise, render nested routes inside
  return <Outlet />;
};

export default ProtectedRoute;
