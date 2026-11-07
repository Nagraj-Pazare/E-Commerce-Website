import jwt from "jsonwebtoken";

const authToken = (req, res, next) => {

  ;
    try {
      const accessToken = req.cookies.accessToken;
      if (!accessToken) throw new Error("No token");
      let decoded = jwt.verify(accessToken, process.env.JWT_SECRET,);
      req.user = decoded;
      // console.log("accessToken", accessToken);
      // console.log("authToken: ", req.user);
      
      next();
    } catch (error) {

      // console.log(error);
      
     if (req.method !== "GET") {
      req.session.pendingRequest = {
        method: req.method,
        url: req.originalUrl,
        body: req.body
      }

      return res.redirect("/refresh?redirect=" + encodeURIComponent(req.originalUrl.split('?')[0]));
    };
    // console.log(error);

      const baseUrl = req.originalUrl.split('?')[0];
      return res.redirect(`/refresh?redirect=${encodeURIComponent(baseUrl)}`);

      
      // res.render('login', {errorMessage:"LogIn First to Access Products"});
      // res.status(500).json({
      //   success: false,
      //   message: "Login First",
      // });
    }
  };

export default authToken;
