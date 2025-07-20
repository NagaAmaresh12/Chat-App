import { Router } from "express";

const router = Router();

router.post("/register", validation());

export default router;
