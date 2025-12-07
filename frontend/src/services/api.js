import axios from "axios";
import { API_CONFIG } from "../config";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// RFPs
export const rfpApi = {
  getAll: () => api.get("/rfps"),
  getById: (id) => api.get(`/rfps/${id}`),
  create: (data) => api.post("/rfps", data),
  update: (id, data) => api.put(`/rfps/${id}`, data),
  delete: (id) => api.delete(`/rfps/${id}`),
  sendToVendors: (id, vendorIds) => api.post(`/rfps/${id}/send`, { vendorIds }),
};

// Vendors
export const vendorApi = {
  getAll: () => api.get("/vendors"),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post("/vendors", data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Proposals
export const proposalApi = {
  getByRFP: (rfpId) => api.get(`/proposals/rfp/${rfpId}`),
  getById: (id) => api.get(`/proposals/${id}`),
  parse: (data) => api.post("/proposals/parse", data),
};

// Comparisons
export const comparisonApi = {
  getByRFP: (rfpId) => api.get(`/comparisons/rfp/${rfpId}`),
  generate: (rfpId) => api.post(`/comparisons/rfp/${rfpId}/generate`),
};

// Email
export const emailApi = {
  checkInbox: () => api.post("/email/check"),
};

export default api;
