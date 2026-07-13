import { Router } from "express";
import { addToCart, deleteCartItem, getCart, mergeCartAfterLogin, updateCartItem } from "../controllers/cart.controllers";
import { auth } from "../middlewares/auth";


const router = Router()

router.get("/get-cart", auth, getCart);
router.post("/add-cart",auth, addToCart);
router.put("/update-cart",auth, updateCartItem);
router.delete("/delete-cart",auth, deleteCartItem)

router.post('/merge-cart', auth, mergeCartAfterLogin);



export default router;