import express from "express";
import authToken from "../middleware/authToken.js";
import authAdmin from "../middleware/authAdmin.js";
import {
  updateProductRoute,
  filterProductByName,
  filterByCategory,
  filterByPrice,
  addToCart,
  getCart,
  removeItem,
  updateItemQuantity,
  createOrder,
  placedOrder,
  allUsersOrders,
  updateOrderStatus,
  showAllProductsController,
  addProductController,
  updateProductController,
  deleteProductController,
  getSingleProduct,
  createRazorpayOrder,
  verifyPayment
} from "../controllers/product.controller.js";
import { attachProductTypes } from '../middleware/attachProductTypes.js'


const productRouter = express.Router();

productRouter.use(attachProductTypes);

productRouter.get("/products", authToken, showAllProductsController);
productRouter.post("/products", authToken, authAdmin, addProductController);
productRouter.get("/add-product", authToken, (req, res) => {
  return res.render("add-product");
});
productRouter.get("/update-product/:id", authToken, authAdmin, updateProductRoute);

productRouter.get("/filtered-product", authToken, filterProductByName);

productRouter.get("/filter-by", authToken, filterByCategory, filterByPrice);

productRouter.get("/addToCart", authToken, addToCart);

productRouter.get("/cart", authToken, getCart);

productRouter.get("/remove-item", authToken, removeItem);

productRouter.get("/update-quantity", authToken, updateItemQuantity);

// productRouter.get('/admin/orders', authToken, authAdmin, getOrdersController)

productRouter.post("/create-order", authToken, createRazorpayOrder);
productRouter.post("/verify-payment", authToken, verifyPayment);
productRouter.post("/checkout", authToken, createOrder);

productRouter.get("/placed-orders", authToken, placedOrder);

productRouter.get("/admin/orders", authToken, authAdmin, allUsersOrders);

productRouter.get(
  "/admin/update-status",
  authToken,
  authAdmin,
  updateOrderStatus,
);


productRouter.patch(
  "/products/:id",
  authToken,
  authAdmin,
  updateProductController,
  
);
productRouter.delete(
  "/products/:id",
  authToken,
  authAdmin,
  deleteProductController,
);
productRouter.get("/products/:id", authToken, getSingleProduct);

export default productRouter;
