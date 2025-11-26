import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import AppRoutes from "@/routes/AppRouter.tsx";
import Loader from "@/components/common/Loader.tsx";
import { fetchUserProfile } from "@/features/auth/authThunks.ts";
import { connectSocket } from "@/services/socket/socketClientFile.ts";
// import { useSocket } from "@/hooks/useSocket.ts";
// import { connectSocket } from "./lib/socket";

function App() {
  const currentUser = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // const { socket } = useSocket(); // ✅ FIXED correct destructuring

  // --- Rehydrate User ---
  useEffect(() => {
    if (currentUser.id == null) {
      dispatch(fetchUserProfile())
        .unwrap()
        .then((result) => console.log("✅ Auth rehydrated:", result))
        .catch((error) => console.error("❌ Failed to rehydrate:", error));
    }
  }, [dispatch, currentUser.id]);

  // // --- Debug socket status ---

  useEffect(() => {
    const socket = connectSocket();
    console.log("🔌 Socket connected?", socket.connected);
    return () => {
      socket.disconnect();
    };
  }, []);

  if (status === "loading") return <Loader />;

  return <AppRoutes />;
}

export default App;
