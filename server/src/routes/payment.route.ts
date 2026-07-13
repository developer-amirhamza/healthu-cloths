import { Router } from "express";
import { createCheckoutSession } from "../controllers/paymentControllers";
import { auth } from "../middlewares/auth";

const router = Router();


router.post("/create-checkout-session",auth, createCheckoutSession);








export default router;