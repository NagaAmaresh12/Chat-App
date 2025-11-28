import ChatInterfaceBgImagePng from "@/assets/Doodle-1 1.png";
import { useIsMobile } from "@/hooks/useMobile";

const ChatInterfaceBgImage = () => {
  const isMobile = useIsMobile(); // true on mobile, false on desktop
  return (
    <div className="absolute z-1 flex flex-wrap select-none pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <img
          key={i}
          src={ChatInterfaceBgImagePng}
          alt=""
          className={`${
            isMobile ? "h-30" : "h-78 "
          }flex shrink-0 object-contain select-none pointer-events-none drag-none`}
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
        />
      ))}
    </div>
  );
};

export default ChatInterfaceBgImage;
