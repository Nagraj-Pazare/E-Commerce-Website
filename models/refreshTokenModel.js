import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema({
        token:{
            type:String,
            required:true
        },
        uid:{
            type:String,
            required:true
        },
        expiry:{
            type:String,
            required:true
        }
}, { timestamp: true });

const refreshTokenModel = mongoose.model("refreshToken", refreshTokenSchema);

export default refreshTokenModel;