import { useLocation } from "react-router-dom";
import ProfileDetails from "@/components/profile/ProfileDetails";
import ProfilePlaceholder from "../placeholder/ProfilePlaceholder";

const ProfileInterface = () => {
  const { pathname } = useLocation();
  return (
    <section className="w-full h-screen bg-amber-700 flex">
      <ProfileDetails />
      <main className="">
        <ProfilePlaceholder />
      </main>
    </section>
  );
};

export default ProfileInterface;
