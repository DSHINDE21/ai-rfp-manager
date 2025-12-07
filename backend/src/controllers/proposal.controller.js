import Proposal from "../models/Proposal.js";
import { AppError } from "../middleware/errorHandler.js";
import { parseProposal } from "../services/parser.service.js";

// Get all proposals for an RFP
export const getProposalsByRFP = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ rfpId: req.params.rfpId })
      .populate("vendorId", "name email")
      .sort({ receivedAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Get single proposal
export const getProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate("rfpId")
      .populate("vendorId");

    if (!proposal) {
      return next(new AppError("Proposal not found", 404));
    }

    res.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Manually trigger parsing (for testing)
export const parseProposalManually = async (req, res, next) => {
  try {
    const { proposalId, rfpId, vendorId, content } = req.body;

    // If full content provided, create proposal first
    if (rfpId && vendorId && content) {
      // Check if proposal already exists for this RFP-Vendor pair
      let proposal = await Proposal.findOne({ rfpId, vendorId });

      if (proposal) {
        // Update existing
        proposal.emailContent = {
          subject: "Manual Proposal Entry",
          from: "manual@demo.com",
          body: content,
        };
        proposal.status = "pending";
        proposal.receivedAt = new Date();
        await proposal.save();
      } else {
        // Create new
        proposal = await Proposal.create({
          rfpId,
          vendorId,
          emailContent: {
            subject: "Manual Proposal Entry",
            from: "manual@demo.com",
            body: content,
          },
          status: "pending",
          receivedAt: new Date(),
        });
      }

      // Parse the proposal
      const result = await parseProposal(proposal._id);

      // Re-fetch with populated fields
      const populatedProposal = await Proposal.findById(proposal._id)
        .populate("vendorId", "name email")
        .populate("rfpId", "title rfpId");

      return res.json({
        success: true,
        message: "Proposal created and parsed successfully",
        data: populatedProposal,
        tokensUsed: result.tokensUsed,
      });
    }

    // Original behavior: just parse existing proposal
    if (!proposalId) {
      return next(new AppError("Proposal ID or (rfpId + vendorId + content) required", 400));
    }

    const result = await parseProposal(proposalId);

    res.json({
      success: true,
      message: "Proposal parsed successfully",
      data: result.data,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
