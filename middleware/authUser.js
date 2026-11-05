import User from "../models/userModel.js";

const authUser = async (req, res, next)=>{
    // console.log(req.body);
    
    try {
       const { email } = req.body;
    const user = await User.findOne({email});
    
    if(user){
        req.user = user;
        next();
    } else{
        return res.status(404).render('login', { errorMessage: "Invaild Email Register First"})
    } 
    } catch (error) {
        // console.log("authUser Error: ", error);
        return res.status(400).redirect('/');
        
    }
    
}

export default authUser;