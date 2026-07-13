import { Router } from "express";
import {
  getTradeCatalogue,
  placeTradeOrder,
  quickReorder,
  listStandingOrders,
  upsertStandingOrder,
} from "../controllers/trade.controllers";
import { auth } from "../middlewares/auth";
import { requireRole, ROLES } from "../middlewares/role";

const router = Router();

// All trade routes are gated to approved TRADE accounts (and admins).
const trade = requireRole(ROLES.TRADE, ROLES.ADMIN);

router.get("/catalogue", auth, trade, getTradeCatalogue);
router.post("/order", auth, trade, placeTradeOrder);
router.post("/reorder", auth, trade, quickReorder);

router.get("/standing-orders", auth, trade, listStandingOrders);
router.put("/standing-orders", auth, trade, upsertStandingOrder);

export default router;