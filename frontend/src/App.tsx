import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import AppRoutes from "@/routes/AppRouter.tsx";
import { rehydrateAuth } from "./features/auth/authThunks.ts";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const rehydrate = async () => {
      try {
        const result = await dispatch(rehydrateAuth()).unwrap();
        console.log("✅ Auth rehydrated:", result);
      } catch (err) {
        console.error("❌ Failed to rehydrate:", err);
      }
    };

    rehydrate();
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;
