import { Router } from "express";
import {
  submitFundingEnquiry,
  submitEnquiry,
  listEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiry.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Public/optional-auth submissions. `auth` populates userId when a token is
// present; funding enquiries are typically raised by a logged-in coordinator.
router.post("/funding", auth, submitFundingEnquiry);
router.post("/", submitEnquiry);

// Admin inbox
router.get("/", auth, admin, listEnquiries);
router.put("/status", auth, admin, updateEnquiryStatus);

export default router;