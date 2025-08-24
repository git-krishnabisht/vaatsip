import express from "express";
import multer from "multer";
import { protectedRoute } from "../middlewares/auth.middleware.js";

import { get_messages, send_messages } from "../controllers/comm.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.get("/get-messages/:id", protectedRoute, get_messages);

router.post(
  "/send-message/:receiver_id",
  upload.array("image_data"),
  protectedRoute,
  send_messages
);

export default router;
