import ProfileInterfaceBgImage from "@/assets/Ellipse 18.png";
import { User } from "lucide-react";
const ProfilePlaceholder = () => {
  return (
    <section className="flex-1 items-center justify-center flex h-full w-full  relative ">
      <div className="h-120 w-120 rounded-full  object-cover">
        <img src={ProfileInterfaceBgImage} alt="" className="h-full w-full" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2  h-52 w-52 flex flex-col items-center justify-center gap-4">
          <div className="h-22 w-22 rounded-full bg-custom-bg-1! p-2 ">
            <User className="h-full w-full text-white! " />
          </div>
          <h5 className="py-1 px-5 bg-custom-bg-1 text-white rounded-3xl">
            Profile
          </h5>
        </div>
      </div>
    </section>
  );
};

export default ProfilePlaceholder;
