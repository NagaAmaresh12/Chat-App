import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import AppRoutes from "@/routes/AppRouter.tsx";
import Loader from "@/components/common/Loader.tsx";
import { fetchUserProfile } from "@/features/auth/authThunks.ts";
// import { useSocket } from "@/hooks/useSocket.ts";

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
  // useEffect(() => {
  //   if (!socket) return;

  //   console.log("🔌 Socket connected?", socket.connected);
  // }, [socket]); // ✅ use socket, not user

  if (status === "loading") return <Loader />;

  return <AppRoutes />;
}

export default App;
