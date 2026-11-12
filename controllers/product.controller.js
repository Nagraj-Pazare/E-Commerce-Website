import express from 'express'
import redisClient from '../config/redisClient.js';
import Product from "../models/productModel.js";
import Order from "../models/ordersModel.js";
import Cart from "../models/userCartModel.js";
import User from "../models/userModel.js";
import Address from "../models/addressModel.js";
// import User from "../models/UserModel.js";
import Razorpay from 'razorpay'
import bodyParser from 'body-parser'
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils.js'
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils.js';
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { rm } from "node:fs/promises";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname)));

const razorpay = new Razorpay({
  key_id: process.env.RZR_KEY_ID,
  key_secret: process.env.RZR_KEY_SECRET,
});



export const updateProductRoute = async (req, res) => {
  await redisClient.del('all_products');
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    return res.render("update-product", { id, product });
  } catch (error) {
    console.log(error);
    return res.render("products");
  }
};

export const showAllProductsController = async (req, res) => {
  const { role } = req.user;

  try {
    const cacheKey = 'all_products';

    // 1. Check Redis cache
    const cachedProducts = await redisClient.get(cacheKey);

    if (cachedProducts) {
      console.log("Products fetched from Redis");

      res.setHeader('X-Cache', 'HIT');

      return res.status(200).render("products", {
        success: true,
        isAdmin: role === "admin",
        products: JSON.parse(cachedProducts),
      });
    }

    // 2. Fetch products from MongoDB
    console.log("Products fetched from MongoDB");

    const products = await Product.find().lean();

    // 3. Store products in Redis (TTL = 10 minutes)
    const result = await redisClient.set(
      cacheKey,
      JSON.stringify(products),
      {
        EX: 600,
      }
    );

   console.log("Redis SET result:", result);

// Verify Redis data
const cachedData = await redisClient.get('all_products');

console.log("Redis data exists:", !!cachedData);
    

    res.setHeader('X-Cache', 'MISS');

    // 4. Render products
    return res.status(200).render("products", {
      success: true,
      isAdmin: role === "admin",
      products,
    });

  } catch (error) {
    console.error("Show All Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const addProductController = async (req, res) => {
  await redisClient.del('all_products');
  try {
    const { role } = req.user;
    const { name, type, price } = req.body;
    console.log(req.body);

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    const uploadDir = path.join(__dirname, "../public/uploads/", req.body.name);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    } else {
      return res.render("add-product", {
        errorMessage: "Product Already Exist",
      });
    }

    let savedImageNames = [];

    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      for (const file of files) {
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const uploadPath = path.join(uploadDir, uniqueFileName);
        await file.mv(uploadPath);
        savedImageNames.push(uniqueFileName);
      }
    }
    const newProduct = new Product({
      name,
      type,
      price,
      images: savedImageNames,
    });
    await newProduct.save();
    return res.status(200).redirect("products");
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .render("add-product", { errorMessage: "Product Name must be Unique" });
    }
  };
  
  export const updateProductController = async (req, res) => {
  await redisClient.del('all_products');
  try {
    const { id } = req.params;
    console.log("Patch Route");

    const updateProduct = req.body;
    await Product.findByIdAndUpdate(id, { ...updateProduct });
    return res.redirect("/products");
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Bad Request",
    });
  }
};

export const deleteProductController = async (req, res) => {
  await redisClient.del('all_products');
  try {
    const { id } = req.params;
    
    const { name } = await Product.findOne({ _id: id });
    console.log(name);
    const deleteDir = path.join(__dirname, "../public/uploads/", name);

    await rm(deleteDir, { recursive: true, force: true });
    
    await Product.findByIdAndDelete(id);
    return res.redirect("/products");
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Bad Request",
    });
  }
};

export const getSingleProduct = async (req, res) => {

  try {
    const { id } = req.params;
  const user = req.user;

  const product = await Product.findOne({ _id: id });
  const products = await Product.find({ type: product.type, _id: { $ne: id }});
  // console.log(products);
  
  
  console.log(user);

  return res.render("single-product", {
    product,
    products,
    user
  });
  } catch (error) {
    console.log(error);
    return res.redirect('/products');
  }
  
};

export const filterProductByName = async (req, res) => {
  try {
    let { searchData } = req.query;
    const { role } = req.user;
    let products
    if(searchData){
      searchData = searchData.toLowerCase();
    const safeInput = searchData.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

     products = await Product.find({
      $or:[
        {name: { $regex: safeInput, $options: "i" }},
        {type: { $regex: safeInput, $options: "i" }}
      ]
    });
    }

    else{
      products = await Product.find()
    }

    // console.log(products);
    return res.render("products", {
      success: true,
      isAdmin: role == "admin",
      products: products,
      searchData
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Bad Request",
    });
  }
};

export const filterByCategory = async (req, res, next) => {
  try {
    let { type, searchData } = req.query;
    const { role } = req.user;
    type = type.toLowerCase();

    // console.log("filterByCategory: ",req.query.priceFilter);
    

    let products;

    const safeInput = type.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    if (type == "all") {
      if(searchData){
      searchData = searchData.toLowerCase();
      const safeInput = searchData.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

       products = await Product.find({
       name: { $regex: safeInput, $options: "i" },
    });
    }

    else{
      products = await Product.find().lean();
    }
      // return res.status(200).render("products", {
      //   success: true,
      //   isAdmin: role == "admin",
      //   products: products,
      // });
      req.products = products;
      
      next();
    } else {

      if(searchData){
      searchData = searchData.toLowerCase();
      const safeInputSearchData = searchData.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
       products = await Product.find({
       name: { $regex: safeInputSearchData, $options: "i" },
       type: { $regex: safeInput, $options: "i" },
    }).lean();
    }

    else{
      products = await Product.find({
        type: { $regex: safeInput, $options: "i" },
      }).lean();
    }



     
      // return res.status(200).render("products", {
      //   success: true,
      //   isAdmin: role == "admin",
      //   products: products,
      // });
      req.products = products;
      

      // console.log(req.products);
      
      next();
    }
  } catch (error) {
    console.log("filterCategory: ", error);
    return res.end();
  }
};

export const filterByPrice = async (req, res) => {
  try {
    console.log(req.products);
    const products = req.products;
    const { role } = req.user;

    const { priceFilter, searchData, type } = req.query;
    // console.log(priceFilter);

    if (priceFilter == "lowtohigh") {
      products.sort((a, b) => a.price - b.price);
    } else if (priceFilter == "hightolow") {
      products.sort((a, b) => b.price - a.price);
    }

    return res.status(200).render("products", {
      success: true,
      isAdmin: role == "admin",
      products: products,
      searchData,
      type,
      priceFilter
    });
  } catch (error) {
    console.log("filterCategory: ", error);
    return res.end();
  }
};

export const addToCart = async (req, res) => {
  const { productId, userId, quantity } = req.query;
  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += Number(quantity);
      } else {
        cart.items.push({ productId, quantity: Number(quantity) });
      }

      await cart.save();
    } else {
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity: Number(quantity) }],
      });
    }

    return res.status(200).redirect('/cart');
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }

}


export const getCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    //  console.log(cart);
    const cartItems = cart ? cart.items : [];
    //  console.log(cartItems);

    const addresses = await Address.find({ userId }).sort({ isDefault: -1 });
    if(!cartItems){
      return res.redirect("/products")
    }

    return res.status(200).render("cart", {
      success: true,
      cartItems,
      addresses
    });

  } catch (error) {
    console.log(error);
    return res.end();
  }
}

export const removeItem = async (req, res) => {

  try {
    const { userId } = req.user;
    const cartUser = await Cart.find({userId});
    console.log(cartUser);
    
    
    const { productId } = req.query;
    console.log(productId);
    
      const updatedCart = await Cart.findOneAndUpdate(
      {userId},
      {
        $pull: { 
          items: { productId } 
        }
      },
     { returnDocument: 'after' }
    );

   
    if (!updatedCart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart document not found." 
      });
    }
    return res.status(200).redirect('/cart');
    
  } catch (error) {
    console.log(error);
    res.end();

  }

}

export const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { productId, update } = req.query;

    console.log("User:", userId, "| Product:", productId, "| Action:", update);

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "Missing userId or productId." });
    }

    const changeValue = update === 'decrement' ? -1 : 1;

    const updatedCart = await Cart.findOneAndUpdate(
      { 
        userId: userId, 
        "items.productId": productId 
      },
      { 
        $inc: { "items.$.quantity": changeValue } 
      },
      { returnDocument: 'after'}
    );

    if (!updatedCart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart document or product not found." 
      });
    }

    await Cart.updateOne(
      { userId: userId },
      { $pull: { items: { quantity: { $lte: 0 } } } }
    );



    return res.redirect('/cart');
  } catch (error) {
    console.error("Update quantity error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// export const getOrdersController = async (req, res) => {
  
//   const orders = await Cart.find();
//   console.log(orders);

//   const [ ...userId ] = orders;

//   userId.array.forEach(e => {
//     console.log(e);
//   });
  
  
  // const userDetails = await User.find({ userId });

//   return res.end();
// }


export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    const options = {
      amount: Math.round(amount * 100), // Convert amount to paise
      currency: currency || 'INR',
      receipt: receipt || 'receipt_' + Date.now(),
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);
    console.log(order);
    
    return res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ message: "Failed to create Razorpay order", error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: 'failure', message: 'Missing payment verification details' });
    }

    // Verify the signature using your Razorpay secret key
    const secret = process.env.RZR_KEY_SECRET; // Your Razorpay key_secret from top of file
    
    const isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      secret
    );

    if (isValid) {
      return res.status(200).json({ status: 'ok', message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ status: 'failure', message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};


export const createOrder = async (req, res) => {

 console.log("Decoded JWT user object:", req.user);
  console.log(req.body);
  
  
  try {
    const { items, addressId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body; 
    console.log(addressId);
    console.log("create Order: ", req.user);
    
    
    const userId = req.user.userId; 
    
    console.log("items: ", items);
    
    

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided in the order." });
    }if (!addressId) {
      return res.status(400).json({ message: "Delivery address is required." });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Payment details are missing." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

     const address = await Address.findOne({_id: addressId});
    if (!address) {
      return res.status(404).json({ message: "Selected address not found." });
    }



    let totalAmount = 0;
    const formattedItems = [];

    // Loop through items to fetch current prices and build the order items array
    for (const item of items) {
      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      const itemTotal = productDoc.price * item.quantity;
      totalAmount += itemTotal;

      formattedItems.push({
        product: productDoc._id,
        quantity: item.quantity,
        priceAtPurchase: productDoc.price, 
      });
    }
    

    const newOrder = new Order({
      user: userId,
      items: formattedItems,
      totalAmount,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || "",
        city: address.city,
        stateOrProvince: address.stateOrProvince,
        postalCode: address.postalCode,
        country: address.country
      },
      payment: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: "Paid"
      }
    });

    const savedOrder = await newOrder.save();

    await Cart.findOneAndDelete({userId});

    return res.status(201).json({ message: "Order placed successfully", orderId: savedOrder._id });

  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const placedOrder = async (req, res) => {

  try {
    const { userId } = req.user;
    const placedOrders = await Order.find({ user: userId })
      .populate("user", "username email role") 
      .populate({
        path: "items.product",      
        select: "name price image"   
      })
      .sort({ createdAt: -1 }).lean();      

    return res.status(200).render('placed-orders',{
      placedOrders,
      count: placedOrders.length
    })


  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
    
  }
 
}

export const allUsersOrders = async (req, res) => {
 try {
  
   const orders = await Order.find()
   .populate("user", "username email role") 
   .populate({
        path: "items.product",      
        select: "name price image"   
      })
   .sort({ createdAt: -1 });

  //  console.log(orders[0].items[0]);
   
    return res.render('admin-order',{
      orders
    });

 } catch (error) {
  console.log(error);
  res.end();
  
 }
}


export const updateOrderStatus = async (req, res) => {
  const {orderId, status } = req.query;

  await Order.findOneAndUpdate({_id: orderId},
    {
      status: status
    }
  );
  

  res.redirect('/admin/orders');
  
}