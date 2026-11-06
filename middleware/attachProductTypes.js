import Product from '../models/productModel.js'

export const attachProductTypes = async (req, res, next) => {
  try {
    const types = await Product.distinct("type");
    res.locals.types = types;
    req.types = types; 
    next();
  } catch (error) {
    console.log("Error fetching product types:", error);
    next(error);
  }
};