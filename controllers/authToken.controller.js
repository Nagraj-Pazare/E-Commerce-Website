import refreshTokenModel from "../models/refreshTokenModel.js";
import { jwtDecode } from "jwt-decode";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../controllers/token.controller.js";
import User from "../models/userModel.js";

export const authRefreshToken = async (req, res) => {
  try {
    const redirectTo = req.query.redirect || "/";

    const refreshToken = req.cookies.refreshToken;
    const dbRefreshToken = await refreshTokenModel.findOne({
      token: refreshToken,
    });

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const dbRefreshTokenExpiry = Number(dbRefreshToken.expiry);

    if (currentTimeInSeconds > dbRefreshTokenExpiry) {
      return res.render("login", {
        errorMessage: "Refresh Token Expired Login to generate New One",
      });
    } else {
      res.clearCookie("accessToken");
      const user = await User.findOne({ _id: dbRefreshToken.uid });
      // console.log(user);

      const newAccessToken = generateAccessToken(user);
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
      return res.redirect(redirectTo);
    }
  } catch (error) {
    // console.log(error);
    return res.redirect("/login");
  }
};
