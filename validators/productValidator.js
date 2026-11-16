import { z } from "zod";


export const addProductSchema = z.object({
 name: z.string().trim().min(3, "Product Name must be at least 3 characters"),
  type: z.string().trim().min(2, "Type must be at least 2 characters"),
  price: z.coerce.number().gt(0, "Price must be greater than zero"),
  stocks: z.coerce.number().int("Stocks must be a whole number").min(0, "Stocks cannot be negative"),
})

export const updateProductSchema = z.object({
  price: z.coerce.number().gt(0, "Price must be greater than zero"),
  stocks: z.coerce.number().int("Stocks must be a whole number").min(0, "Stocks cannot be negative"),
})


