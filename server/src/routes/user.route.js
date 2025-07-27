import express from "express";
import multer from "multer";
import { protectedRoute } from "../middlewares/auth.middleware.js";

import {
  uploadProfile,
  getPictures,
  getUsers,
  getUser,
  userDelete,
  userUpdate,
  userDetails,
} from "../controllers/user.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.post(
  "/upload-profile",
  upload.single("image"),
  protectedRoute,
  uploadProfile
);
router.get("/get-pictures/:username", getPictures);
router.get("/get-users", protectedRoute, getUsers);
router.get("/get-user", protectedRoute, getUser);
router.delete("/user-delete", userDelete);
router.put("/user-update", userUpdate);
router.get("/user-details/:username", protectedRoute, userDetails);

export default router;
