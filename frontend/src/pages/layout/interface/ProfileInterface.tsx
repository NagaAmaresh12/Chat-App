import ProfileDetails from "@/components/profile/ProfileDetails";
import ProfilePlaceholder from "../placeholder/ProfilePlaceholder";

const ProfileInterface = () => {
  return (
    <section className="w-full h-screen bg-[#F6F7F8] flex relative">
      <ProfileDetails />
      <main className="border border-l relative h-full w-full ">
        <ProfilePlaceholder />
      </main>
    </section>
  );
};

export default ProfileInterface;
