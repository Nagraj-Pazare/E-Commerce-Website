import jwt from 'jsonwebtoken'

export const isLoggedOut = async (req, res, next) => {
    try {
    const accessToken = req.cookies.accessToken;
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET,);
    return res.redirect('products');
    } catch (error) {
        // console.log("isLoggedOut: ", error);
        next();
    }
}