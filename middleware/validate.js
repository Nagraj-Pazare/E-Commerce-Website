// middleware/validate.js
export const validate = (schema) => (req, res, next) => {
  try {
    console.log("validate: ", req.body);
    const parsed = schema.parse(req.body);
    
    req.body = parsed;
    next();
  } catch (error) {
    console.log("validate-error: ", error.message);
    
    next(error);
  }
};