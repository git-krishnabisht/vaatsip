import express from "express";
import multer from "multer";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { getMessages, sendMessages } from "../controllers/message.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.get("/get-messages/:user", protectedRoute, getMessages);
router.post("/send-message/:receiver", upload.single("image_data"), protectedRoute, sendMessages);

export default router;
