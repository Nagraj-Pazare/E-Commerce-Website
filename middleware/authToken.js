import jwt from "jsonwebtoken";

const authToken = (req, res, next) => {

  let decoded;
    try {
      const accessToken = req.cookies.accessToken;
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET,);
      req.user = decoded;
      // console.log("accessToken", accessToken);
      next();
    } catch (error) {
      const originalUrl = req.originalUrl;
      // console.log(error);
      return res.redirect(`/refresh?redirect=${encodeURIComponent(originalUrl)}`);
      // res.render('login', {errorMessage:"LogIn First to Access Products"});
      // res.status(500).json({
      //   success: false,
      //   message: "Login First",
      // });
    }
  };

export default authToken;
