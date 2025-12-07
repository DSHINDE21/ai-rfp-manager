import RFP from '../models/RFP.js';
import { AppError } from '../middleware/errorHandler.js';
import { extractRFPFromNaturalLanguage } from '../services/ai.service.js';

// Create RFP (with optional AI extraction)
export const createRFP = async (req, res, next) => {
  try {
    let rfpData = req.body;
    let extractionResult = null;
    
    // Strip out database-generated fields to prevent duplicate key errors
    const { _id, rfpId, createdAt, updatedAt, __v, ...cleanBody } = req.body;
    rfpData = cleanBody;
    
    // If naturalLanguage is provided, extract structured data using AI
    if (req.body.naturalLanguage) {
      extractionResult = await extractRFPFromNaturalLanguage(req.body.naturalLanguage);
      
      // Merge AI-extracted data with defaults
      const extractedData = extractionResult.data || {};
      rfpData = {
        title: extractedData.title || "Untitled RFP",
        description: extractedData.description || req.body.naturalLanguage,
        items: extractedData.items || [],
        budget: extractedData.budget || 0,
        timeline: extractedData.timeline || "Not specified",
        paymentTerms: extractedData.paymentTerms || "",
        warranty: extractedData.warranty || "",
        structuredData: extractedData // Store original extracted data
      };
    }
    
    const rfp = await RFP.create(rfpData);
    
    res.status(201).json({
      success: true,
      data: rfp,
      ...(req.body.naturalLanguage && extractionResult && { tokensUsed: extractionResult.tokensUsed })
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Get all RFPs
export const getAllRFPs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const rfps = await RFP.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: rfps.length,
      data: rfps
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Get single RFP
export const getRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id);
    
    if (!rfp) {
      return next(new AppError('RFP not found', 404));
    }
    
    res.json({
      success: true,
      data: rfp
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Update RFP
export const updateRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!rfp) {
      return next(new AppError('RFP not found', 404));
    }
    
    res.json({
      success: true,
      data: rfp
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Delete RFP
export const deleteRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findByIdAndDelete(req.params.id);
    
    if (!rfp) {
      return next(new AppError('RFP not found', 404));
    }
    
    res.json({
      success: true,
      message: 'RFP deleted successfully'
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

