// ========== AppRoutes.tsx (FIXED) ==========
import { Routes, Route } from "react-router-dom";
import NotFound from "@/pages/NotFound.tsx";
import WelcomePage from "@/pages/WelcomePage.tsx";
import MainLayout from "@/pages/layout/MainLayout.tsx";

import ProfilePage from "@/pages/layout/interface/ProfileInterface";
import SettingsView from "@/pages/Settings.tsx";
import LoginPage from "@/pages/LoginPage.tsx";
import ChatInterface from "@/pages/layout/interface/ChatInterface";
import UserInterface from "@/pages/layout/interface/UserInterface.tsx";
import ChatDetails from "@/components/chats/ChatDetails";
import UserDetails from "@/components/users/UserDetails";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />}></Route>
      <Route path="/home" element={<WelcomePage />}></Route>
      <Route path="/app" element={<MainLayout />}>
        <Route path="/app/chats" element={<ChatInterface />}>
          <Route path="/app/chats/:chatId" element={<ChatDetails />} />
        </Route>
        <Route path="/app/users" element={<UserInterface />}>
          <Route path="/app/users/:userId" element={<UserDetails />} />
        </Route>
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/settings" element={<SettingsView />} />
      </Route>
      <Route path="*" element={<NotFound />}></Route>
    </Routes>
  );
};

export default AppRoutes;
