import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks.ts"; // <-- your typed Redux hook
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  // ✅ Check for access token in Redux or cookies You can NOT read cookies, because http:true,secure;true,samesite:strict, has set in backend
  // const tokenFromCookies =
  //   Cookies.get("accessToken") || Cookies.get("refreshToken");
  // console.log({ tokenFromCookies });

  // 🔒 If user not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Otherwise render the protected page
  return <>{children}</>;
};

export default ProtectedRoute;
