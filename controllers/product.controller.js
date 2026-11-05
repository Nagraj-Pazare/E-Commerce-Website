import Product from "../models/productModel.js";
import Order from "../models/ordersModel.js";
import Cart from "../models/userCartModel.js";
import User from "../models/userModel.js";
// import User from "../models/UserModel.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { rm } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const updateProductRoute = async (req, res) => {
  try {
    const { id } = req.body;
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
    // console.log(__dirname);
    // const user = await User.find()
    const products = await Product.find().lean();
    // console.log(products);
    // console.log("Hello");
    res.status(200).render("products", {
      success: true,
      isAdmin: role == "admin",
      products: products,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Bad Request",
    });
  }
};

export const addProductController = async (req, res) => {
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

  const { id } = req.params;
  const user = req.user;

  const product = await Product.findOne({ _id: id });
  
  console.log(user);

  return res.render("single-product", {
    product,
    user
  });
};

export const cartController = async (req, res) => {
  return res.render("cart");
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
      name: { $regex: safeInput, $options: "i" },
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

      console.log(req.products);
      
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
    console.log(priceFilter);

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

    if(!cartItems){
      return res.redirect("/products")
    }

    return res.status(200).render("cart", {
      success: true,
      cartItems,
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
    
    

    // await cartUser.save();
    res.end();
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
  
  
//   // const userDetails = await User.find({ userId });

//   return res.end();
// }


export const createOrder = async (req, res) => {

  console.log(req.user);
  
  try {
    const { items } = req.body; 
    const userId = req.user.userId; 

    console.log(req.body);
    
    console.log("items: ", items);

    

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided in the order." });
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
    });

    const savedOrder = await newOrder.save();

    await Cart.findOneAndDelete({userId});

    res.status(201).json({ message: "Order placed successfully", order: savedOrder });

  } catch (error) {
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
      .sort({ createdAt: -1 });      

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