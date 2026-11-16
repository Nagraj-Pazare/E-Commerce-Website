import mongoose from 'mongoose'
import { required } from 'zod/mini';

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique: true
    },
    type:{
       type:String,
        required:true

    },
    price:{
        type:Number,
        required:true
    },
    images:{
        type: Array,
    },
    stocks: {
        type: Number,
        required: true,
    }
});

const Product = mongoose.model("Product", productSchema);

export default Product;