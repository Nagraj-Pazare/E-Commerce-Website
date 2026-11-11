import User from '../models/userModel.js'

const authAdmin = async (req, res, next)=>{
    // console.log(req.user);
    
    try {
        const { email } = req.user;
    const user = await User.findOne({email});
    
    if(user.role == 'admin'){
        req.user = user;
        next();
    } else{
        res.status(401).redirect('/products');
    }
    } catch (error) {
        console.log(error);
        return res.alert("Auth Admin Error: ", error)
        
    }
    
}

export default authAdmin;