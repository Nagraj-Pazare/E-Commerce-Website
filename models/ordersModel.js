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


const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true }, // Crucial for delivery drivers
  addressLine1: { type: String, required: true, trim: true }, // Street address, P.O. box, company name
  addressLine2: { type: String, trim: true }, // Apartment, suite, unit, building, floor
  city: { type: String, required: true, trim: true },
  stateOrProvince: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true }, // Zip code
  country: { type: String, required: true, trim: true }, // ISO country code (e.g., "US", "IN", "CA")
  isDefault: { type: Boolean, default: false } // Useful if users save multiple addresses
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
    shippingAddress: { type: addressSchema, required: true },
  },
  { timestamps: true, expires: 1728000 }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;