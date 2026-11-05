import express from "express";
import authToken from "../middleware/authToken.js";
import authAdmin from "../middleware/authAdmin.js";
import { authRefreshToken } from "../controllers/authToken.controller.js";
import { updateProductRoute, filterProductByName, filterByCategory, filterByPrice, addToCart, getCart, removeItem, updateItemQuantity, createOrder, placedOrder, allUsersOrders, updateOrderStatus } from "../controllers/product.controller.js";

const productRouter = express.Router();

productRouter.get("/add-product", authToken, (req, res) => {
  return res.render("add-product");
});
productRouter.post("/update-product", authToken, authAdmin, updateProductRoute);

productRouter.get("/refresh", authRefreshToken);

productRouter.get("/filtered-product", authToken, filterProductByName);

productRouter.get("/filter-by", authToken, filterByCategory, filterByPrice);

productRouter.get('/addToCart', authToken, addToCart);

productRouter.get('/cart', authToken, getCart);

productRouter.get('/remove-item', authToken, removeItem)

productRouter.get('/update-quantity', authToken, updateItemQuantity);

// productRouter.get('/admin/orders', authToken, authAdmin, getOrdersController)

productRouter.post('/checkout', authToken, createOrder);

productRouter.get('/placed-orders', authToken, placedOrder);

productRouter.get('/admin/orders', authToken, authAdmin, allUsersOrders);

productRouter.get('/admin/update-status', authToken, authAdmin, updateOrderStatus);


export default productRouter;
