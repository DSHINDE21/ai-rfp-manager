import express from "express";
import {
  getComparison,
  generateComparison,
} from "../controllers/comparison.controller.js";

const router = express.Router();

router.get("/rfp/:rfpId", getComparison);
router.post("/rfp/:rfpId/generate", generateComparison);

export default router;
