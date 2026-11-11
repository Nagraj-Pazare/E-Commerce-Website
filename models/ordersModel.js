import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: [1, "Quantity cannot be less than 1."],
  },
  priceAtPurchase: { 
    type: Number,
    required: true,
  }
  
});


const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    stateOrProvince: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
    status: {
      type: String,
      required: true,
      enum: ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    payment: {
      razorpayOrderId: { type: String, required: true },
      razorpayPaymentId: { type: String, required: true },
      razorpaySignature: { type: String, required: true },
      paymentStatus: { type: String, required: true, default: "pending" }
    }
  },
  { timestamps: true, expires: 1728000 }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;