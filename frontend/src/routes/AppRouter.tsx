// ========== AppRoutes.tsx (FIXED) ==========
import { Routes, Route } from "react-router-dom";
import NotFound from "@/pages/NotFound.tsx";
import WelcomePage from "@/pages/WelcomePage.tsx";
import MainLayout from "@/pages/layout/MainLayout.tsx";
import ChatsView from "@/pages/layout/ChatView.tsx";
import UsersView from "@/pages/layout/UsersView.tsx";
import ProfilePage from "@/pages/ProfilePage.tsx";
import SettingsView from "@/pages/Settings.tsx";
import LoginPage from "@/pages/LoginPage.tsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />}></Route>
      <Route path="/home" element={<WelcomePage />}></Route>
      <Route path="/" element={<WelcomePage />}></Route>
      <Route path="/app" element={<MainLayout />}>
        <Route path="chats" element={<ChatsView />} />
        <Route path="users" element={<UsersView />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile" element={<SettingsView />} />
      </Route>
      <Route path="*" element={<NotFound />}></Route>
    </Routes>
  );
};

export default AppRoutes;
