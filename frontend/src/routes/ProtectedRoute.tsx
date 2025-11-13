import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks.ts";
import Loader from "@/components/common/Loader.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, status } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // show a loading spinner if verifying session
  if (status == "loading") return <Loader />;

  // if user not found, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
