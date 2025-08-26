import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";

import { get_messages } from "../controllers/comm.controller.js";

const router = express.Router();

router.get("/get-messages/:id", protectedRoute, get_messages);

export default router;
