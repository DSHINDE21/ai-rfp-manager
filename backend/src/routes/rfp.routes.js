import express from "express";
import {
  createRFP,
  getAllRFPs,
  getRFP,
  updateRFP,
  deleteRFP,
} from "../controllers/rfp.controller.js";
import { sendRFPToVendors } from "../services/email.service.js";
import { AppError } from "../middleware/errorHandler.js";

const router = express.Router();

router.post("/", createRFP);
router.get("/", getAllRFPs);
router.get("/:id", getRFP);
router.put("/:id", updateRFP);
router.delete("/:id", deleteRFP);

// Send RFP to vendors
router.post("/:id/send", async (req, res, next) => {
  try {
    const { vendorIds } = req.body;
    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return next(new AppError("Please provide at least one vendor ID", 400));
    }

    const result = await sendRFPToVendors(req.params.id, vendorIds);
    
    // Check if any emails were sent successfully
    const successCount = result.results?.filter((r) => r.success).length || 0;
    const totalCount = result.results?.length || 0;
    const allFailed = successCount === 0 && totalCount > 0;

    if (allFailed) {
      // All emails failed - return error with details
      const firstError = result.results?.find((r) => !r.success)?.error || "Failed to send emails";
      return res.status(500).json({
        success: false,
        message: `Failed to send RFP to all vendors. ${firstError}`,
        data: {
          rfpId: result.rfpId,
          successCount: 0,
          failedCount: totalCount,
          results: result.results,
        },
      });
    }

    // At least some emails sent successfully
    res.json({
      success: true,
      message: `RFP sent to ${successCount}/${totalCount} vendor(s)`,
      data: {
        rfpId: result.rfpId,
        successCount,
        failedCount: totalCount - successCount,
        results: result.results,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
});

export default router;
