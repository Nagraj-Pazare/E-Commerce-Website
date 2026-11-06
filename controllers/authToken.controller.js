import refreshTokenModel from "../models/refreshTokenModel.js";
import { jwtDecode } from "jwt-decode";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../controllers/token.controller.js";
import User from "../models/userModel.js";

export const authRefreshToken = async (req, res) => {
  try {
    res.setHeader("Refresh", "900");

    const rawRedirect = req.query.redirect || "/";
    const redirectTo = rawRedirect.split("?")[0];

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.redirect("/login");
    }
    const dbRefreshToken = await refreshTokenModel.findOne({
      token: refreshToken,
    });

    if (!dbRefreshToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.redirect("/login");
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const dbRefreshTokenExpiry = Number(dbRefreshToken.expiry);

    if (currentTimeInSeconds > dbRefreshTokenExpiry) {
      await refreshTokenModel.deleteOne({ _id: dbRefreshToken._id });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
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
        sameSite: "strict",
      });

      if (req.session.pendingRequest) {
        const pending = req.session.pendingRequest;
        delete req.session.pendingRequest;
        req.method = pending.method;
        req.body = pending.body;
        req.url = pending.url;
        req.originalUrl = pending.url;

        return req.app.handle(req, res);
      }
      console.log("REFRESH SUCCESSFUL. Redirecting back to:", redirectTo);


      return res.redirect(redirectTo);
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/login");
  }
};
