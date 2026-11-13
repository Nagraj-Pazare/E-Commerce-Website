// middleware/validate.js
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.errors?.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })) || [],
    });
  }
};