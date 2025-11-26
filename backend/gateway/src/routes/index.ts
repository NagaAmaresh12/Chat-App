import { Router } from "express";
import proxy from "../middlewares/proxy.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

// USERS SERVICE
router.use("/users", (req, res, next) => {
  // Detect public user routes
  const { path } = req;

  const PUBLIC_USER_ROUTES = [
    "/auth/login",
    "/auth/register",
    "/auth/verify-otp",
    "/auth/verify-token",
    "/auth/refresh-token",
    "/auth/verify-email",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/check-email",
    "/health",
    "/status",
    "/public/",
  ];

  const isPublic = PUBLIC_USER_ROUTES.some((route) => {
    if (route.endsWith("/")) return path.startsWith(route);
    return path === route;
  });

  if (isPublic) {
    console.log("📢 Public USERS route → allowing without token:", path);
    return proxy("users-service")(req, res, next);
  }

  // If NOT public → apply verifyToken
  return verifyToken(req, res, () => {
    console.log("📢 Private USERS route → allowing with token:", path);
    proxy("users-service")(req, res, next);
  });
});

// OTHER PROTECTED SERVICES
router.use("/chats", verifyToken, proxy("chats-service"));
router.use("/messages", verifyToken, proxy("messages-service"));
router.use("/notifications", verifyToken, proxy("notifications-service"));
router.use("/sockets", verifyToken, proxy("sockets-service"));

export default router;
