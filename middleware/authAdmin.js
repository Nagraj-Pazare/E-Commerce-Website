import User from '../models/userModel.js'

const authAdmin = async (req, res, next)=>{
    // console.log(req.user);
    
    const { email } = req.user;
    const user = await User.findOne({email});
    
    if(user.role == 'admin'){
        req.user = user;
        next();
    } else{
        res.status(404).render('products');
    }
    
}

export default authAdmin;