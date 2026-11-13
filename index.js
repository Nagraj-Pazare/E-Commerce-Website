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
import bodyParser from 'body-parser'
import path from "path";
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import methodOverride from "method-override";
import { jwtDecode } from "jwt-decode";
import fileUpload from "express-fileupload";
import session from "express-session";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./controllers/token.controller.js";

import { authRefreshToken } from "./controllers/authToken.controller.js";

import hbs from 'hbs'




const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static('public')); 
// app.use(express.static(path.join(__dirname)));
app.use(fileUpload({
  createParentPath: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "hbs");
app.get("/refresh", authRefreshToken); 
app.use("/", userRouter);
app.use("/", productRouter);

app.set("view options", { layout: false });
app.use((req, res, next) => {
  res.status(404).render("error-page", {
    statusCode: 404,
    errorTitle: "Page Not Found",
    errorMessage: "We couldn't find the page you were looking for."
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    error: process.env.NODE_ENV === "production"
      ? undefined
      : err.stack,
  });
});

hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
});
hbs.registerHelper('toLowerCase', function (str) {
  return str ? str.toLowerCase() : '';
});
connectToDB();







app.listen(3000, () => {
  console.log("Server is running on 3000 port");
});
