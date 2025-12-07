import Vendor from '../models/Vendor.js';
import { AppError } from '../middleware/errorHandler.js';

// Create vendor
export const createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    
    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Get all vendors
export const getAllVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    
    res.json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Get single vendor
export const getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    
    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Update vendor
export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    
    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Delete vendor
export const deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    
    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

