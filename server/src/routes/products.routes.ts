import { Router } from "express";
import { createProduct, deleteProduct, getAllProductDetails, getProductDetails, getProductsByCategory, getProductsBySubcategory, searchProducts, updateProduct } from "../controllers/products.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Public
router.post("/get-details", getProductDetails);
router.get("/search", searchProducts);
router.get("/all", getAllProductDetails);
router.post("/by-category", getProductsByCategory);
router.post("/by-subcategory", getProductsBySubcategory);

// Admin only
router.post("/create", auth, admin, createProduct);
router.put("/update", auth, admin, updateProduct);
router.delete("/delete", auth, admin, deleteProduct);

export default router;