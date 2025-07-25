import { Router } from "express";
import proxy from "../middlewares/proxy.js";

const router = Router();
console.log("route check", proxy("user-service"));

router.use("/users", proxy("users-service"));

router.use("/chats", proxy("chats-service"));
router.use("/messages", proxy("messages-service"));
router.use("/media", proxy("media-service"));
router.use("/socket", proxy("socket-service"));

export default router;
