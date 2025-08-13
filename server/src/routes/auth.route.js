import express from "express";
import { oauth_signin, sign_up, sign_out, sign_in } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/oauth-signin", oauth_signin);
router.post("/sign-in", sign_in);
router.post("/sign-up", sign_up);
router.post("/sign-out", sign_out);

export default router;
