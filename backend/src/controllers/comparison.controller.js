import Comparison from '../models/Comparison.js';
import Proposal from '../models/Proposal.js';
import RFP from '../models/RFP.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateComparison as generateAIComparison } from '../services/ai.service.js';

// Get comparison for an RFP
export const getComparison = async (req, res, next) => {
  try {
    const comparison = await Comparison.findOne({ rfpId: req.params.rfpId })
      .populate('proposals')
      .populate('scores.vendorId', 'name email')
      .populate('scores.proposalId')
      .populate('aiRecommendation.vendorId', 'name email')
      .populate('aiRecommendation.proposalId');
    
    if (!comparison) {
      return res.json({
        success: true,
        message: 'No comparison found. Generate one first.',
        data: null
      });
    }
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Generate AI comparison
export const generateComparison = async (req, res, next) => {
  try {
    const { rfpId } = req.params;
    
    // Verify RFP exists
    const rfp = await RFP.findById(rfpId);
    if (!rfp) {
      return next(new AppError('RFP not found', 404));
    }
    
    // Get all proposals for this RFP
    const proposals = await Proposal.find({ rfpId })
      .populate('vendorId');
    
    if (proposals.length === 0) {
      return next(new AppError('No proposals found for this RFP', 404));
    }
    
    // Generate AI comparison
    const aiResult = await generateAIComparison(rfp, proposals);
    const aiData = aiResult.data;
    
    // Map scores to include proposal and vendor IDs
    const scores = aiData.scores.map((score, index) => ({
      vendorId: proposals[score.proposalIndex].vendorId._id,
      proposalId: proposals[score.proposalIndex]._id,
      priceScore: score.priceScore,
      complianceScore: score.complianceScore,
      termsScore: score.termsScore,
      completenessScore: score.completenessScore,
      overallScore: score.overallScore
    }));
    
    // Get recommended vendor and proposal
    const recommendedIndex = aiData.recommendation.vendorIndex;
    const recommendedProposal = proposals[recommendedIndex];
    
    const comparisonData = {
      rfpId,
      proposals: proposals.map(p => p._id),
      scores,
      aiSummary: aiData.summary,
      aiRecommendation: {
        vendorId: recommendedProposal.vendorId._id,
        proposalId: recommendedProposal._id,
        reasoning: aiData.recommendation.reasoning,
        confidence: aiData.recommendation.confidence
      }
    };
    
    // Update or create comparison
    const comparison = await Comparison.findOneAndUpdate(
      { rfpId },
      comparisonData,
      { new: true, upsert: true }
    )
      .populate('proposals')
      .populate('scores.vendorId', 'name email')
      .populate('scores.proposalId')
      .populate('aiRecommendation.vendorId', 'name email')
      .populate('aiRecommendation.proposalId');
    
    res.json({
      success: true,
      message: 'Comparison generated successfully',
      data: comparison,
      tokensUsed: aiResult.tokensUsed
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

