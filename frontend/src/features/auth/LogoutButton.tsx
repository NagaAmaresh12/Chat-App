import { Button } from "@/components/ui/button.tsx";
import { useAppDispatch } from "@/redux/hooks.ts";
import { logoutUser } from "@/features/auth/authThunks.ts";
import { useNavigate } from "react-router-dom";
const LogoutButton = ({ className }: { className: string }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
    console.log("Clicked on LogoutButton");

    try {
      await dispatch(logoutUser()).unwrap(); // ⬅ wait for API

      navigate("/login");
    } catch (error: any) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <Button variant={"outline"} onClick={handleLogout} className={className}>
      Logout
    </Button>
  );
};

export default LogoutButton;
