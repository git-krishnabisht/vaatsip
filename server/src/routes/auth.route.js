import express from "express";
import { signIn, signUp, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/sign-in", signIn);
router.post("/sign-up", signUp);
router.post("/logout", logout);

export default router;
