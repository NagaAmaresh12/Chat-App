import { Button } from "@/components/ui/button.tsx";
import { useAppDispatch } from "@/redux/hooks.ts";
import { logoutUser } from "@/features/auth/authThunks.ts";
import { useNavigate } from "react-router-dom";
const LogoutButton = ({ className }: { className: string }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
    console.log("Clicked on LogoutButton");

    dispatch(logoutUser()).unwrap();
    navigate("/login");
  };
  return (
    <Button variant={"outline"} onClick={handleLogout} className={className}>
      Logout
    </Button>
  );
};

export default LogoutButton;
