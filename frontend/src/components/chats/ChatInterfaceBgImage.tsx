import ChatInterfaceBgImagePng from "@/assets/Doodle-1 1.png";

const ChatInterfaceBgImage = () => {
  return (
    <div className="absolute z-1 flex flex-wrap select-none pointer-events-none">
      <img
        src={ChatInterfaceBgImagePng}
        alt=""
        className="h-70 select-none pointer-events-none drag-none"
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
      <img
        src={ChatInterfaceBgImagePng}
        alt=""
        className="h-70 select-none pointer-events-none drag-none"
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
      <img
        src={ChatInterfaceBgImagePng}
        alt=""
        className="h-70 select-none pointer-events-none drag-none"
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
      <img
        src={ChatInterfaceBgImagePng}
        alt=""
        className="h-70 select-none pointer-events-none drag-none"
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
      <img
        src={ChatInterfaceBgImagePng}
        alt=""
        className="h-70 select-none pointer-events-none drag-none"
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
      <img
        src={ChatInterfaceBgImagePng}
        alt=""
        className="h-70 select-none pointer-events-none drag-none"
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default ChatInterfaceBgImage;
