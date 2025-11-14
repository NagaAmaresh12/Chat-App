import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import AppRoutes from "@/routes/AppRouter.tsx";
import { rehydrateAuth, logoutUser } from "./features/auth/authThunks.ts";
import { logout, isLoading } from "@/features/auth/authSlice.ts";
import Loader from "./components/common/Loader.tsx";

function App() {
  const dispatch = useAppDispatch();
  const { user, status } = useAppSelector((state) => state.auth);
  useEffect(() => {
    const rehydrate = async () => {
      if (!user) {
        try {
          const result = await dispatch(rehydrateAuth()).unwrap();
          console.log("✅ Auth rehydrated:", result);
        } catch (error) {
          console.error("❌ Failed to rehydrate:", error);
        }
      }
    };
    rehydrate();
  }, [dispatch]);
  return <AppRoutes />;
}

export default App;
