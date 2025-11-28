import { Search } from "lucide-react";
import UserInterfaceBgImagePng from "@/assets/Rectangle 7.png";
const description = [
  {
    id: "1",
    paragraph:
      "Discover new users to chat with or search for groups to join. It's easy to connect and share moments with friends!",
  },
  {
    id: "2",
    paragraph: "Find people. Start chatting.",
  },
];
const UserPlaceholder = () => {
  return (
    <section className="w-full h-screen px-5">
      <div className="h-[45%]  w-full rounded-lg mt-10 z-2 relative object-cover flex items-center justify-center  shadow-md px-0 ">
        <div className="h-full w-full flex flex-wrap overflow-hidden">
          <img src={UserInterfaceBgImagePng} alt="" className="h-35" id="1" />
          <img src={UserInterfaceBgImagePng} alt="" className="h-35" id="2" />
          <img src={UserInterfaceBgImagePng} alt="" className="h-35" id="3" />
          <img src={UserInterfaceBgImagePng} alt="" className="h-35" id="4" />
          <img src={UserInterfaceBgImagePng} alt="" className="h-35" id="5" />
          <img src={UserInterfaceBgImagePng} alt="" className="h-35" id="6" />
        </div>
        <div
          className="flex absolute items-center justify-center gap-5
bg-linear-to-r from-custom-bg-1 to-[#FD047C]
rounded-3xl px-10 py-2 text-xl text-white"
        >
          <span>
            <Search className=" text-white w-5 h-5" />
          </span>
          <span>Search</span>
        </div>
      </div>

      <div className="  h-full w-full relative py-4">
        {description.map((item) => (
          <div
            id={item?.id || item?.paragraph.charAt(0)}
            className="border-l-10 my-5  border-[#FD047C] h-fit  w-full relative flex items-center justify-start  pl-10"
          >
            <p className="h-full w-fit shadow bg-white text-[#FD047C] p-4 rounded-lg">
              {item?.paragraph}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UserPlaceholder;
