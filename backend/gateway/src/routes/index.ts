import { Router } from "express";
import proxy from "../middlewares/proxy.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();
//Public Routes
router.use("/users", proxy("users-service"));
//protected Routes
router.use("/chats", verifyToken, proxy("chats-service"));
router.use("/messages", verifyToken, proxy("messages-service"));
router.use("/notifications", verifyToken, proxy("notifications-service"));
router.use("/sockets", verifyToken, proxy("sockets-service"));

export default router;
