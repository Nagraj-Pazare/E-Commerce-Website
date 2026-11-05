import express from "express";
import "dotenv/config";
import User from "./models/userModel.js";
import Otp from "./models/otpModel.js";
import refreshTokenModel from "./models/refreshTokenModel.js";
import Product from "./models/productModel.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import authToken from "./middleware/authToken.js";
import authUser from "./middleware/authUser.js";
import authAdmin from "./middleware/authAdmin.js";
import axios from "axios";
import bcrypt from "bcrypt";
import connectToDB from "./config/database.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import methodOverride from "method-override";
import { jwtDecode } from "jwt-decode";
import fileUpload from "express-fileupload";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./controllers/token.controller.js";
import {
  registerController,
  loginController,
  forgetPasswordController,
  verifyResetOtpController,
  resetPasswordController,
} from "./controllers/user.controller.js";

import {
  showAllProductsController,
  addProductController,
  updateProductController,
  deleteProductController,
  getSingleProduct,
  cartController
} from "./controllers/product.controller.js";
import hbs from 'hbs'



const app = express();
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static('public')); 
app.use(fileUpload({
  createParentPath: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "hbs");
app.use("/", userRouter);
app.use("/", productRouter);
app.set("view options", { layout: false });
hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
});
hbs.registerHelper('toLowerCase', function (str) {
  return str ? str.toLowerCase() : '';
});
connectToDB();

app.post("/register", registerController);

app.post("/login", authUser, loginController);

app.post("/forget-password", authUser, forgetPasswordController);

app.post("/verify-reset-otp", authUser, verifyResetOtpController);

app.post("/reset-password", resetPasswordController);

app.get("/products", authToken, showAllProductsController);

app.get("/product/:id", authToken, getSingleProduct)

app.get("/cart", authToken, cartController)

app.post("/products", authToken, authAdmin, addProductController);

app.patch("/products/:id", authToken, authAdmin, updateProductController);

app.delete("/products/:id", authToken, authAdmin, deleteProductController);

app.listen(3000, () => {
  console.log("Server is running on 3000 port");
});
