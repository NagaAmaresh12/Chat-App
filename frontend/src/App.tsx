import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import AppRoutes from "@/routes/AppRouter.tsx";
import { rehydrateAuth } from "@/features/auth/authThunks.ts";
import Loader from "@/components/common/Loader.tsx";
import { useSocket } from "@/hooks/useSocket.ts";

function App() {
  const { user, status } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { socket } = useSocket(); // ✅ FIXED correct destructuring

  // --- Rehydrate User ---
  useEffect(() => {
    if (!user) {
      dispatch(rehydrateAuth())
        .unwrap()
        .then((result) => console.log("✅ Auth rehydrated:", result))
        .catch((error) => console.error("❌ Failed to rehydrate:", error));
    }
  }, [dispatch, user]);

  // --- Debug socket status ---
  useEffect(() => {
    if (!socket) return;

    console.log("🔌 Socket connected?", socket.connected);
  }, [socket]); // ✅ use socket, not user

  if (status === "loading") return <Loader />;

  return <AppRoutes />;
}

export default App;
