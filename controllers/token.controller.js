import jwt from 'jsonwebtoken';

const generateAccessToken = (user)=>{
    return jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1m" },
      );
}

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );
}

export { generateAccessToken, generateRefreshToken }