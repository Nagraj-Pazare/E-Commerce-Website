import refreshTokenModel from "../models/refreshTokenModel.js";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/ordersModel.js";
import Otp from "../models/otpModel.js";
import nodemailer from "nodemailer";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../controllers/token.controller.js";
import { jwtDecode } from "jwt-decode";

export const logoutController = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    const dbRefreshToken = await refreshTokenModel.findOne({
      token: refreshToken,
    });
    const { uid } = dbRefreshToken;
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    await refreshTokenModel.deleteMany({ uid });
    return res.render("login", { errorMessage: "Logout Successfull" });
  } catch (error) {
    // console.log(error);
    return res.render("login", { errorMessage: "Login First" });
  }
};

export const registerController = async (req, res) => {
  try {
    console.log(req.body);
    const { username, role, email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username,
      email: email,
      role: role,
      password: hashPassword.toString(),
    });
    await newUser.save();
    return res.render("login", {
      errorMessage: "Account Created Successfully.\n Please Login"
    });
  } catch (error) {
    console.log(error);
    return res.status(400).render('login',  {
        errorMessage: "Account with these email already exist.",
      })
  }
};

export const loginController = async (req, res) => {
  try {
    // console.log(req.body);

    const { email, password, role } = req.body;
    const user = req.user;

    const isPassMatch = await bcrypt.compare(password, user.password);
    if (isPassMatch && user.role == role) {
      // console.log("Hello");

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const decoded = jwtDecode(refreshToken);
      const refreshTokenExpiryInSeconds = decoded.exp;
      // console.log(refreshToken);

      const newRefreshToken = new refreshTokenModel({
        token: refreshToken,
        uid: user._id,
        role: user.role,
        expiry: refreshTokenExpiryInSeconds,
      });
      await newRefreshToken.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
      if(role == "admin"){
          return res.redirect("/admin-dashboard");
      } else{
        return res.redirect("/products");
      }
      // return res.json({
      //   success: true,
      //   message: "Login Success...",
      // });
    } else {
      return res.render("login", {
        errorMessage: "Enter Valid Password and Role",
      });
    }
  } catch (error) {
    console.log(error);
    // res.alert("Enter Proper Credentials")
    return res.render("login", { errorMessage: "Enter Proper Credentials" });
    // return res.status(400).json({
    //   success: false,
    //   message: "Bad Request",
    // });
  }
};

export const forgetPasswordController = async (req, res, { email }) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    console.log(user);

    if (user) {
      const sentOtp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(sentOtp);

      await Otp.deleteMany({ email });
      const newOtp = new Otp({
        email: email,
        otp: sentOtp,
      });
      await newOtp.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SENDER_EMAIL,
          pass: process.env.SENDER_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Otp for password reset",
        text: "Otp: " + sentOtp,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(400).json({
            success: false,
            message: "Unable to send the Otp",
          });
        } else {
          return res.render("verifyOtp");
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No user found with email: " + email,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Bad Request",
    });
  }
};

export const verifyResetOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    const dbOtp = await Otp.findOne({ email });
    if (user) {
      if (otp == dbOtp.otp) {
        dbOtp.isVerified = true;
        await dbOtp.save();

        return res.render("resetPassword");
      } else {
        return res.status(404).json({
          success: false,
          message: "Otp verification Failed...",
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "Email Address is Not valid...",
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .render("forgetPassword", { errorMessage: "OTP Expired send new One" });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    const { isVerified } = await Otp.findOne({ email });

    // console.log(otp.isVerified);

    if (isVerified) {
      if (newPassword != confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Password Match Failed...",
        });
      } else {
        const newHashPassword = await bcrypt.hash(confirmPassword, 10);
        await User.findOneAndUpdate(
          { email },
          { $set: { password: newHashPassword } },
        );
        return res
          .status(200)
          .render("login", { errorMessage: "Password Updated" });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "First verify Otp",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Bad Request",
    });
  }
};

export const getAllUsersController =  async (req, res)=>{

  const { role } = req.user;
  console.log(role);
  

    const users = await User.find();
    return res.render('users', { 
      success: true,
      isAdmin: role == "admin",
      users: users
    });


    // res.status(200).render("products", {
    //   success: true,
    //   isAdmin: role == "admin",
    //   products: products,
    // })
};

export const adminDashboard = async (req, res) => {
  
  const { role } = req.user;


  const users = User.find();
  const userCount = await users.countDocuments({})
  const products = Product.find();
  const productCount = await products.countDocuments({})
  const orders = Order.find();
  const orderCount = await orders.countDocuments({})
  
  return res.render('admin-dashboard',
    {
      userCount,
      productCount,
      orderCount,
      isAdmin: role=='admin'
    }
  );
  
}

export const deleteUserController = async (req, res) => {
    const { uid } = req.body;
    await User.findByIdAndDelete({_id: uid});
    return res.redirect('/users');
}

export const filterUserByName = async (req, res, next) => {
  let { searchData } = req.query;
  console.log(searchData);
  let users;
  
    if(searchData){
      searchData = searchData.toLowerCase();
    const safeInput = searchData.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    users = await User.find({
      username: { $regex: safeInput, $options: "i" },
    });
  }
  else{
    users = await User.find();
  }

  return res.status(200).render('users',{
    users,
    searchData
  })

}

export const filterUserBy = async (req, res, next) => {
  try {
    const { sortUserBy } = req.query;
    
    let sortQuery = {};
    if (sortUserBy === 'atoz') {
      sortQuery = { username: 1 }; 
    } else if (sortUserBy === 'ztoa') {
      sortQuery = { username: -1 }; 
    }

    const users = await User.find().sort(sortQuery).collation({ locale: 'en', strength: 2 }).lean();
    
    return res.status(200).render("users", {
      success: true,
      users: users,
      sortUserBy
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
};