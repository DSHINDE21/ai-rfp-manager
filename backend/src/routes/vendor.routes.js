import express from "express";
import {
  createVendor,
  getAllVendors,
  getVendor,
  updateVendor,
  deleteVendor,
} from "../controllers/vendor.controller.js";

const router = express.Router();

router.post("/", createVendor);
router.get("/", getAllVendors);
router.get("/:id", getVendor);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
