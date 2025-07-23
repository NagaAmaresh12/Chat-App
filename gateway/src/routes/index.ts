import { Router } from "express";
import proxy from "../middlewares/proxy.js";

const router = Router();
console.log("route check", proxy("user-service"));

router.use("/users", proxy("users-service"));

router.use("/chats", proxy("chats-service"));
router.use("/messages", proxy("message-service"));
router.use("/media", proxy("media-service"));
router.use("/notifications", proxy("notifications-service"));
router.use("/search", proxy("search-service"));

export default router;
