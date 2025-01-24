import express from "express";
import multer from "multer";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { signIn, signUp, uploadProfile, getPictures, getUsers, getUser, userDelete, userUpdate, userDetails } from "../controller/auth.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.post("/sign-in", signIn);
router.post("/sign-up", signUp);
router.post("/upload-profile", upload.single("image"), protectedRoute, uploadProfile);
router.get("/get-pictures/:username", getPictures);
router.get("/get-users", protectedRoute, getUsers);
router.get("/get-user", protectedRoute, getUser);
router.delete("/user-delete", userDelete); //No use for now
router.put("/user-update", userUpdate); //No use for now
router.get("/user-details/:user", protectedRoute, userDetails);

export default router;