import express from "express";
import authUser from "../middleware/authUser.js";
import authAdmin from "../middleware/authAdmin.js";
import authToken from "../middleware/authToken.js";
import { validate } from "../middleware/validate.js";
import { generateAccessToken, generateRefreshToken } from "../controllers/token.controller.js";
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
  displayProfile
} from "../controllers/user.controller.js";

import {addAddress, getUserAddresses, changeDefaultAddress, editAddress, updateAddress, deleteAddress } from '../controllers/address.controller.js'
import Message from "../models/messageModel.js";
import passport from "passport";
import refreshTokenModel from "../models/refreshTokenModel.js";
import { jwtDecode } from "jwt-decode";
import { tryCatch } from "bullmq";

const userRouter = express.Router();

userRouter.get("/", isLoggedOut, (req, res) => {
  return res.render("home");
});

userRouter.post("/register", validate(registerSchema), registerController);

userRouter.post("/login", loginLimiter, authUser,  validate(loginSchema), loginController);

userRouter.post("/forget-password", authUser, forgetPasswordController);

userRouter.post("/verify-reset-otp", authUser, verifyResetOtpController);

userRouter.post("/reset-password", validate(resetPasswordSchema), resetPasswordController);

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

userRouter.get('/auth/google', 
  passport.authenticate('google', {scope: ['profile', 'email']})
);

userRouter.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/'}),
  async (req, res)=>{
    try {
      console.log(req.user);
    const user = req.user;
    
    // console.log("Google CallBack start");
    
        const accessToken = generateAccessToken(req.user);
        const refreshToken = generateRefreshToken(req.user);

        // console.log("Google CallBack accessToken: ", accessToken);
        // console.log("Google CallBack refreshToken: ", refreshToken);
        const decoded = jwtDecode(refreshToken);
        const refreshTokenExpiryInSeconds = decoded.exp;

         const newRefreshToken = new refreshTokenModel({
                token: refreshToken,
                uid: user._id,
                role: user.role,
                expiry: refreshTokenExpiryInSeconds,
              });
              await newRefreshToken.save();
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict"
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict"
        });

        
        // console.log("Google CallBack ENd");
        const redirectUrl = req.user.role === "admin" ? "http://localhost:3000/admin-dashboard" : "http://localhost:3000/products";
        console.log(redirectUrl);
        return res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google Callback Error:", error);
      return res.redirect('/');
    }
  }
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

userRouter.get("/user-chat", authToken, async (req, res) => {
  const { userId } = req.user;

  const user = await User.findOne({_id: userId}).lean();
  const messages = await Message.findOne({userId}).lean();
  // console.log(messages);
  
  
  return res.render('user-chat', {
    user,
    messages: messages ? messages.messages : [],
  });
})

userRouter.get("/admin-chat", authToken, authAdmin, async (req, res) => {
  // 1. Find only threads that have at least 1 message, sorted newest first
  const threads = await Message.find({ "messages.0": { $exists: true } })
    .sort({ updatedAt: -1 })
    .populate({
      path: "userId",
      select: "_id username email role", // Excludes password safely
    })
    .lean();

  // 2. Extract the user objects and convert _id to a string for Handlebars
  const users = threads
    .filter((thread) => thread.userId)
    .map((thread) => ({
      ...thread.userId,
      _id: thread.userId._id.toString(),
      lastMessageAt: thread.updatedAt,
    }));

  return res.render("admin-chat", {
    users,
  });
});


userRouter.get("/admin-chat/messages/:userId", authToken, authAdmin, async (req, res) => {
  const { userId } = req.params;
  const chat = await Message.findOne({ userId }).lean();
  return res.json(chat ? chat.messages : []);
});

userRouter.post("/change-default-address", authToken, changeDefaultAddress);

userRouter.post("/edit-address", authToken, editAddress);

userRouter.post("/update-address", authToken, updateAddress);

userRouter.post("/delete-address", authToken, deleteAddress);

export default userRouter;
