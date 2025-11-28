// hooks/useIsDesktop.js
import { useState, useEffect } from "react";

export default function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : false
  );

  useEffect(() => {
    function onResize() {
      setIsDesktop(window.innerWidth >= breakpoint);
    }

    window.addEventListener("resize", onResize);
    // optional: listen to orientationchange for mobile devices
    window.addEventListener("orientationchange", onResize);

    // run once in case initial render size changed
    onResize();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [breakpoint]);

  return isDesktop;
}
