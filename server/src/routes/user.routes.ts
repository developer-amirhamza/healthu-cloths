import { Router } from "express";
import { SignUp, SignIn, SignOut, GetUserDetails, getAllUsers, updateUserDetails, deleteUser, verifyEmail, refreshToken, updateUserByAdmin, } from "../controllers/user.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";


const router = Router();

// Auth
router.post("/signup", SignUp);
router.post("/signin", SignIn);
router.get("/signout", auth, SignOut);
router.post("/verify-email", verifyEmail);
router.post("/refresh-token", refreshToken)

// Logged-in user
router.get("/get-user-details", auth, GetUserDetails);
router.put("/update-user", auth, updateUserDetails);

// Admin only
router.get("/all-users", auth, admin, getAllUsers);
router.put("/update-user-by-admin", auth, admin, updateUserByAdmin);
router.delete("/delete-user", auth, admin, deleteUser);

export default router;