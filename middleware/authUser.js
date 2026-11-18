import User from "../models/userModel.js";

const authUser = async (req, res, next)=>{
    // console.log(req.body);
    
    try {
       const email = req.body.email || req.user.email;
       const user = await User.findOne({email});
       console.log("authUser: ", user);
       
    
    if(user){
        req.user = user;
        next();
    } else{
        return res.status(404).render('login', { errorMessage: "Invaild Email Register First"})
    } 
    } catch (error) {
        console.log("authUser Error: ", error);
        return res.status(400).render('login', {
            errorMessage: "User not Found!!"
        });
        
    }
    
}

export default authUser;