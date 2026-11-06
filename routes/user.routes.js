import express from "express";
import authUser from "../middleware/authUser.js";
import authAdmin from "../middleware/authAdmin.js";
import authToken from "../middleware/authToken.js";
import { isLoggedOut } from "../middleware/isLoggedOut.js";
import User from "../models/userModel.js";
import {
  logoutController,
  getAllUsersController,
  deleteUserController,
  filterUserByName,
  filterUserBy,
  adminDashboard,
  registerController,
  loginController,
  forgetPasswordController,
  verifyResetOtpController,
  resetPasswordController,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/", isLoggedOut, (req, res) => {
  return res.render("home");
});

userRouter.post("/register", registerController);

userRouter.post("/login", authUser, loginController);

userRouter.post("/forget-password", authUser, forgetPasswordController);

userRouter.post("/verify-reset-otp", authUser, verifyResetOtpController);

userRouter.post("/reset-password", resetPasswordController);

userRouter.get("/login", isLoggedOut, (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  return res.render("login");
});
userRouter.get("/logout", logoutController);

userRouter.get("/register", isLoggedOut, (req, res) => {
  return res.render("register");
});

userRouter.get("/forget-password", isLoggedOut, (req, res) => {
  return res.render("forgetPassword");
});

userRouter.get("/verify-reset-otp", isLoggedOut, authUser, (req, res) => {
  return res.render("verifyOtp");
});
userRouter.get("/reset-password", isLoggedOut, authUser, (req, res) => {
  return res.render("resetPassword");
});

userRouter.get("/users", authToken, authAdmin, getAllUsersController);

userRouter.post("/delete-user", authToken, authAdmin, deleteUserController);

userRouter.get("/filtered-user", authToken, authAdmin, filterUserByName);

userRouter.get("/filter-user-by", authToken, authAdmin, filterUserBy);

userRouter.get("/admin-dashboard", authToken, authAdmin, adminDashboard);

export default userRouter;
