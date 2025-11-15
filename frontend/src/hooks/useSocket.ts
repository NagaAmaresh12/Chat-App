// ============================================================
// 4. Socket Hook - src/hooks/useSocket.ts
// ============================================================
import { useEffect } from "react";
import { socketService } from "@/services/socket/socketService.ts";
import { useAppSelector } from "@/redux/hooks.ts";

export const useSocket = () => {
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id && user?.accessToken) {
      // Connect socket when user is authenticated
      socketService.connect(user.id, user?.accessToken);

      return () => {
        // Disconnect on unmount
        socketService.disconnect();
      };
    }
  }, [user?.id, user?.accessToken]);

  return socketService;
};
