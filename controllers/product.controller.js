import express from "express";
import redisClient from "../config/redisClient.js";
import Product from "../models/productModel.js";
import Order from "../models/ordersModel.js";
import Cart from "../models/userCartModel.js";
import User from "../models/userModel.js";
import Address from "../models/addressModel.js";
// import User from "../models/UserModel.js";
import Razorpay from "razorpay";
import bodyParser from "body-parser";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { rm } from "node:fs/promises";
import { emailQueue } from "../services/bullmq/queues/emailQueue.js";
import mongoose from "mongoose";

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
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    return res.status(200).render("update-product", { id, product });
  } catch (error) {
    console.log(error);
    return res.render("products");
  }
};

export const showAllProductsController = async (req, res, next) => {
  console.log("Show all Products....");
  
  const { role } = req.user;

  try {
    const cacheKey = "all_products";

    const cachedProducts = await redisClient.get(cacheKey);

    if (cachedProducts) {
      console.log("Products fetched from Redis");

      res.setHeader("X-Cache", "HIT");

      return res.status(200).render("products", {
        success: true,
        isAdmin: role === "admin",
        products: JSON.parse(cachedProducts),
      });
    }

    console.log("Products fetched from MongoDB");

    const products = await Product.find().lean();

    const result = await redisClient.set(cacheKey, JSON.stringify(products), {
      EX: 600,
    });

    console.log("Redis SET result:", result);

    const cachedData = await redisClient.get("all_products");

    console.log("Redis data exists:", !!cachedData);

    res.setHeader("X-Cache", "MISS");

    return res.status(200).render("products", {
      success: true,
      isAdmin: role === "admin",
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const addProductController = async (req, res, next) => {
  await redisClient.del("all_products");
  try {
    const { role } = req.user;
    const { name, type, price, stocks } = req.body;
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
      stocks,
    });
    await newProduct.save();
    return res.status(201).redirect("products");
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .render("add-product", { errorMessage: "Product Name must be Unique" });
  }
};

export const updateProductController = async (req, res, next) => {
  await redisClient.del("all_products");
  try {
    const { id } = req.params;
    console.log("Patch Route");

    const updateProduct = req.body;
    await Product.findByIdAndUpdate(id, { ...updateProduct });
    return res.status(200).redirect("/products");
  } catch (error) {
    next(error);
  }
};

export const deleteProductController = async (req, res, next) => {
  await redisClient.del("all_products");
  try {
    const { id } = req.params;

    const { name } = await Product.findOne({ _id: id });
    console.log(name);
    const deleteDir = path.join(__dirname, "../public/uploads/", name);

    await rm(deleteDir, { recursive: true, force: true });

    await Product.findByIdAndDelete(id);
    return res.status(200).redirect("/products");
  } catch (error) {
    next(error);
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const product = await Product.findOne({ _id: id });
    const products = await Product.find({
      type: product.type,
      _id: { $ne: id },
    });
    // console.log(products);

    console.log(user);

    return res.status(200).render("single-product", {
      product,
      products,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/products");
  }
};

export const filterProductByName = async (req, res, next) => {
  try {
    let { searchData } = req.query;
    const { role } = req.user;
    let products;
    if (searchData) {
      searchData = searchData.toLowerCase();
      const safeInput = searchData.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

      products = await Product.find({
        $or: [
          { name: { $regex: safeInput, $options: "i" } },
          { type: { $regex: safeInput, $options: "i" } },
        ],
      });
    } else {
      products = await Product.find();
    }

    // console.log(products);
    return res.status(200).render("products", {
      success: true,
      isAdmin: role == "admin",
      products: products,
      searchData,
    });
  } catch (error) {
    next(error);
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
      if (searchData) {
        searchData = searchData.toLowerCase();
        const safeInput = searchData.replace(
          /[-[\]{}()*+?.,\\^$|#\s]/g,
          "\\$&",
        );

        products = await Product.find({
          name: { $regex: safeInput, $options: "i" },
        });
      } else {
        products = await Product.find().lean();
      }
      // return res.status(200).render("products", {
      //   success: true,
      //   isAdmin: role == "admin",
      //   products: products,
      // });
      req.products = products;
      res.status(200);

      next();
    } else {
      if (searchData) {
        searchData = searchData.toLowerCase();
        const safeInputSearchData = searchData.replace(
          /[-[\]{}()*+?.,\\^$|#\s]/g,
          "\\$&",
        );
        products = await Product.find({
          name: { $regex: safeInputSearchData, $options: "i" },
          type: { $regex: safeInput, $options: "i" },
        }).lean();
      } else {
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
      res.status(200)
      // console.log(req.products);

      next();
    }
  } catch (error) {
    next(error);
  }
};

export const filterByPrice = async (req, res, next) => {
  try {
    // console.log(req.products);
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
      priceFilter,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  const { productId, userId, quantity } = req.query;
  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId,
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

    return res.status(201).redirect("/cart");
  } catch (error) {
    next(error);
  }
};

export const getCart = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    // console.log(cart);
    let cartItems = cart ? cart.items : [];
    // console.log(cartItems);

    if (!cartItems) {
      return res.status(204).redirect("/products"); //204 matlab no content
    }

    cartItems = cartItems.filter(cartItem => cartItem.productId!==null);
    
    const addresses = await Address.find({ userId }).sort({ isDefault: -1 });
    
    return res.status(200).render("cart", {
      success: true,
      cartItems,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const cartUser = await Cart.find({ userId });
    console.log(cartUser);

    const { productId } = req.query;
    console.log(productId);

    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      {
        $pull: {
          items: { productId },
        },
      },
      { returnDocument: "after" },
    );

    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: "Cart document not found.",
      });
    }
    return res.status(200).redirect("/cart");
  } catch (error) {
    next(error);
  }
};

export const updateItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { productId, update } = req.query;

    console.log("User:", userId, "| Product:", productId, "| Action:", update);

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId or productId." });
    }

    const changeValue = update === "decrement" ? -1 : 1;

    const updatedCart = await Cart.findOneAndUpdate(
      {
        userId: userId,
        "items.productId": productId,
      },
      {
        $inc: { "items.$.quantity": changeValue },
      },
      { returnDocument: "after" },
    );

    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: "Cart document or product not found.",
      });
    }

    await Cart.updateOne(
      { userId: userId },
      { $pull: { items: { quantity: { $lte: 0 } } } },
    );

    return res.status(200).redirect("/cart");
  } catch (error) {
    next(error);
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

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency, receipt, notes, items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided." });
    }
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stocks < item.quantity) {
        return res.status(400).json({
          message: `Sorry, "${product?.name || 'Item'}" is out of stock.`,
        });
      }
    }

    const options = {
      amount: Math.round(amount * 100), // Convert amount to paise
      currency: currency || "INR",
      receipt: receipt || "receipt_" + Date.now(),
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);
    console.log(order);

    return res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  await redisClient.del("placedOrders");
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: "failure",
        message: "Missing payment verification details",
      });
    }

    // Verify the signature using your Razorpay secret key
    const secret = process.env.RZR_KEY_SECRET; // Your Razorpay key_secret from top of file

    const isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      secret,
    );

    if (isValid) {
      return res
        .status(200)
        .json({ status: "ok", message: "Payment verified successfully" });
    } else {
      return res
        .status(400)
        .json({ status: "failure", message: "Invalid payment signature" });
    }
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  // console.log("Decoded JWT user object:", req.user);
  console.log(req.body);

  const {
    items,
    addressId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;
  // console.log(addressId);
  // console.log("create Order: ", req.user);

  const userId = req.user.userId;

  // console.log("items: ", items);

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items provided in the order." });
  }
  if (!addressId) {
    return res.status(400).json({ message: "Delivery address is required." });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Payment details are missing." });
  }


  const isValid = validatePaymentVerification(
    { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
    razorpay_signature,
    process.env.RZR_KEY_SECRET
  );

  if (!isValid) {
    return res.status(400).json({ message: "Invalid payment signature." });
  }

  let session;

  let savedOrder;
  let user;
  let address;
  let emailItems = [];

  try {
    session = await mongoose.startSession();

    await session.withTransaction(
      async () => {
        emailItems = [];
        let totalAmount = 0;
        let formattedItems = [];
        user = await User.findById(userId);
        if (!user) {
          throw new Error("User Not Found..");
        }

        address = await Address.findOne({ _id: addressId });
        if (!address) {
          throw new Error("Selected Address not found...");
        }


        // Loop through items to fetch current prices and build the order items array
        for (const item of items) {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.product,
              stocks: { $gte: item.quantity },
            },
            {
              $inc: { stocks: -item.quantity },
            },
            {
              session,
              returnDocument: "after",
            }
          );

          if (!updatedProduct) {
            throw new Error(
              `Product not found or insufficient stock for: ${item.product}`
            );
          }

          const itemTotal = updatedProduct.price * item.quantity;
          totalAmount += itemTotal;

          formattedItems.push({
            product: updatedProduct._id,
            quantity: item.quantity,
            priceAtPurchase: updatedProduct.price,
          });

          emailItems.push({
            productId: updatedProduct._id.toString(),
            productName: updatedProduct.name || updatedProduct.title || "Product",
            productType: updatedProduct.type,
            quantity: item.quantity,
            priceAtPurchase: updatedProduct.price,
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
            country: address.country,
          },
          payment: {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentStatus: "Paid",
          },
        });

        savedOrder = await newOrder.save({session});

        const cartItem = await Cart.findOneAndDelete({ userId }, {session});
        if (!cartItem) {
          throw new Error("Cant find the Item in Cart to remove");
        }

      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
      },
    );

    //---EMail JoB To bullMQ---
    await emailQueue.add(
      "send-order-confirmation",
      {
        orderId: savedOrder._id,
        email: user.email,
        receiverName: address.fullName,
        phoneNumber: address.phone,
        shippingAddress: savedOrder.shippingAddress,
        items: emailItems,
        totalAmount: savedOrder.totalAmount,
        paymentStatus: "Paid",
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );

    const counts = await emailQueue.getJobCounts(
      "wait",
      "active",
      "completed",
      "failed",
    );

    console.log(`Added Job ID:`, counts);

    await redisClient.del("all_products");

    return res
      .status(201)
      .json({ message: "Order placed successfully", orderId: savedOrder._id });
  } catch (error) {
    if (isValid && razorpay_payment_id) {
      try {
        await razorpay.payments.refund(razorpay_payment_id, {
          notes: { reason: error.message },
        });
        return res.status(400).json({
          message:
            "Item went out of stock during checkout. Your payment has been automatically refunded.",
        });
      } catch (refundErr) {
        console.error("Auto-refund failed:", razorpay_payment_id, refundErr);
      }
    }
    next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const placedOrder = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const cacheKey = `placedOrders:${userId}`;
    const cachedOrders = await redisClient.get(cacheKey);

    if (cachedOrders) {
      console.log("Redis Cache HIT");

      const placedOrders = JSON.parse(cachedOrders);

      return res.status(200).render("placed-orders", {
        placedOrders,
        count: placedOrders.length,
      });
    }

    console.log("Redis Cache MISS");

    const placedOrders = await Order.find({ user: userId })
      .populate("user", "username email role")
      .populate({
        path: "items.product",
        select: "name price image",
      })
      .sort({ createdAt: -1 })
      .lean();

    await redisClient.setEx(cacheKey, 300, JSON.stringify(placedOrders));

    return res.status(200).render("placed-orders", {
      placedOrders,
      count: placedOrders.length,
    });
  } catch (error) {
    next(error);
  }
};

export const allUsersOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "username email role")
      .populate({
        path: "items.product",
        select: "name price image",
      })
      .sort({ createdAt: -1 });

    //  console.log(orders[0].items[0]);

    return res.status(200).render("admin-order", {
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId, status } = req.query;

    const update = await Order.findOneAndUpdate(
      { _id: orderId },
      {
        status: status,
      },
    );

    const userId = update.user.toHexString();

    await redisClient.del(`placedOrders:${userId}`);

    return res.status(200).redirect("/admin/orders");
  } catch (error) {
    next(error);
  }
};
