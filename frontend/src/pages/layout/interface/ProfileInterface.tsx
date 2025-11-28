// ProfileInterface.jsx
import ProfileDetails from "@/components/profile/ProfileDetails";
import ProfilePlaceholder from "../placeholder/ProfilePlaceholder";
import { useIsMobile } from "@/hooks/useMobile"; // adjust path

const ProfileInterface = () => {
  const isMobile = useIsMobile(); // true on mobile, false on desktop
  console.log({ isMobile });

  return (
    <section className="flex-1 h-screen bg-[#F6F7F8] flex">
      {/* LEFT SIDE (always visible) */}
      <ProfileDetails />

      {/* RIGHT SIDE - only render on NON-mobile */}
      {!isMobile && (
        <main className="border-l flex-1 h-screen relative w-full">
          <ProfilePlaceholder />
        </main>
      )}
    </section>
  );
};

export default ProfileInterface;
