import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    otp:{
        type: String,
        required: true
    },
    isVerified:{
        type: Boolean,
        default: false
    },
    createdAt: {
    type: Date,
    default: Date.now,
    expires: 180 
    }
})

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;