import express from "express";
import authToken from "../middleware/authToken.js";
import authAdmin from "../middleware/authAdmin.js";
import { validate } from "../middleware/validate.js";
import { addProductSchema, updateProductSchema } from '../validators/productValidator.js'
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

productRouter.get("/products/:id", authToken, getSingleProduct);
// productRouter.get('/admin/orders', authToken, authAdmin, getOrdersController)


productRouter.get("/placed-orders", authToken, placedOrder);

productRouter.get("/admin/orders", authToken, authAdmin, allUsersOrders);

productRouter.get(
  "/admin/update-status",
  authToken,
  authAdmin,
  updateOrderStatus,
);

productRouter.post("/products", authToken, authAdmin, validate(addProductSchema), addProductController);
productRouter.post("/create-order", authToken, createRazorpayOrder);
productRouter.post("/verify-payment", authToken, verifyPayment);
productRouter.post("/checkout", authToken, createOrder);

productRouter.patch(
  "/products/:id",
  authToken,
  authAdmin,
  validate(updateProductSchema),
  updateProductController,
  
);
productRouter.delete(
  "/products/:id",
  authToken,
  authAdmin,
  deleteProductController,
);

export default productRouter;
