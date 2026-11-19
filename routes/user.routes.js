import express from "express";
import authUser from "../middleware/authUser.js";
import authAdmin from "../middleware/authAdmin.js";
import authToken from "../middleware/authToken.js";
import { validate } from "../middleware/validate.js";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from "../validators/userValidator.js";
import { loginLimiter } from '../middleware/rateLimiter.js'
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
  displayProfile,
  loginRouteController,
  googleCallbackController,
  userChatRouteController,
  adminChatRouteController,
  adminSingleUserChatRoute
} from "../controllers/user.controller.js";

import {addAddress, getUserAddresses, changeDefaultAddress, editAddress, updateAddress, deleteAddress } from '../controllers/address.controller.js'
import passport from "passport";

const userRouter = express.Router();

userRouter.get("/", isLoggedOut, (req, res) => {
  return res.render("home");
});

userRouter.post("/register", validate(registerSchema), registerController);

userRouter.post("/login", loginLimiter, authUser,  validate(loginSchema), loginController);

userRouter.post("/forget-password", authUser, forgetPasswordController);

userRouter.post("/verify-reset-otp", authUser, verifyResetOtpController);

userRouter.post("/reset-password", validate(resetPasswordSchema), resetPasswordController);

userRouter.get("/login", isLoggedOut, loginRouteController);
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

userRouter.get('/auth/google', 
  passport.authenticate('google', {scope: ['profile', 'email']})
);

userRouter.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/'}),
  googleCallbackController
)

userRouter.get("/users", authToken, authAdmin, getAllUsersController);

userRouter.post("/delete-user", authToken, authAdmin, deleteUserController);

userRouter.get("/filtered-user", authToken, authAdmin, filterUserByName);

userRouter.get("/filter-user-by", authToken, authAdmin, filterUserBy);

userRouter.get("/admin-dashboard", authToken, authAdmin, adminDashboard);

userRouter.get("/profile", authToken, getUserAddresses, displayProfile);

userRouter.post("/add-address", authToken, addAddress);

userRouter.get("/add-address-form", authToken, async (req, res) => {
  const { redirectTo } = req.query;
  return res.render('add-address', {
    redirectTo
  });
  
});

userRouter.get("/user-chat", authToken, userChatRouteController)

userRouter.get("/admin-chat", authToken, authAdmin, adminChatRouteController);


userRouter.get("/admin-chat/messages/:userId", authToken, authAdmin, adminSingleUserChatRoute);

userRouter.post("/change-default-address", authToken, changeDefaultAddress);

userRouter.post("/edit-address", authToken, editAddress);

userRouter.post("/update-address", authToken, updateAddress);

userRouter.post("/delete-address", authToken, deleteAddress);

export default userRouter;
