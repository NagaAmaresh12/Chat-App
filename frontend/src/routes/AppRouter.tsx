// ========== AppRoutes.tsx (FIXED CLEAN VERSION) ==========
import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "@/pages/NotFound.tsx";
import WelcomePage from "@/pages/WelcomePage.tsx";
import MainLayout from "@/pages/layout/MainLayout.tsx";

import ProfilePage from "@/pages/layout/interface/ProfileInterface.tsx";
import SettingsView from "@/pages/Settings.tsx";
import LoginPage from "@/pages/LoginPage.tsx";
import ChatInterface from "@/pages/layout/interface/ChatInterface";
import UserInterface from "@/pages/layout/interface/UserInterface.tsx";
import ProtectedRoute from "@/components/auth/ProtectedRoute.tsx";
import AuthRedirect from "./AuthRedirect.tsx";
import MessageDetails from "@/components/messages/MessageDetails.tsx";
import UserInfoPage from "@/pages/layout/placeholder/UserInfoPage.tsx";
import VerifyPage from "@/pages/VerifyPage.tsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthRedirect />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<WelcomePage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<MainLayout />}>
          <Route path="/app/chats" element={<ChatInterface />}>
            <Route path="/app/chats/:chatId" element={<MessageDetails />} />
          </Route>
          <Route path="/app/users" element={<UserInterface />}>
            <Route path="/app/users/:userId" element={<UserInfoPage />} />
          </Route>
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/settings" element={<SettingsView />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
