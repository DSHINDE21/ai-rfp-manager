import express from "express";
import {
  getProposalsByRFP,
  getProposal,
  parseProposalManually,
} from "../controllers/proposal.controller.js";

const router = express.Router();

router.get("/rfp/:rfpId", getProposalsByRFP);
router.get("/:id", getProposal);
router.post("/parse", parseProposalManually);

export default router;
