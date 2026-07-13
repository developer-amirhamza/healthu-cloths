import { Router } from "express";
import { getAllOrdersByAdmin, getMyOrders, getOrdersByOrderNumber, placeOrder, updateOrderByAdmin } from "../controllers/order.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

router.post("/place-order", auth, placeOrder);
router.get("/my-orders", auth, getMyOrders);
router.get("/lookup", getOrdersByOrderNumber);

// Admin only
router.get("/admin/get-all-orders", auth, admin, getAllOrdersByAdmin);
router.put("/admin/update-order", auth, admin, updateOrderByAdmin);

export default router;