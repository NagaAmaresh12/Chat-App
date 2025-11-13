import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { logoutUser } from "@/features/auth/authThunks.ts";
const LogoutButton = () => {
  const dispatch = useAppDispatch();
  const handleLogout = async () => {
    dispatch(logoutUser());
  };
  return (
    <Button variant={"outline"} onClick={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
