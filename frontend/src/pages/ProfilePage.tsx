// ========== ProfileView.tsx (Profile Settings) ==========
import { useParams } from "react-router-dom";
import Profile from "@/pages/ProfilePage";

const ProfileView = () => {
  const { userId } = useParams();

  return (
    <div className="w-full h-full overflow-y-auto">
      <Profile userId={userId} />
    </div>
  );
};

export default ProfileView;
