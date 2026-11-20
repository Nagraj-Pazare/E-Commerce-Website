import jwt from 'jsonwebtoken'

export const isLoggedOut = async (req, res, next) => {
    try {
    const accessToken = req.cookies.accessToken;
    if(accessToken){
        jwt.verify(accessToken, process.env.accessToken);
        return res.redirect('products');
    } else{
        next()
    }
    } catch (error) {
        // console.log("isLoggedOut: ", error);
        next();
    }
}