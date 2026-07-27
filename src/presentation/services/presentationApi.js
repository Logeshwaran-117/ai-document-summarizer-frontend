
/**
 * presentationApi.js
 * Frontend Service Client for AI Presentation Generation API endpoints.
 * Uses shared configured API instance (`api.js`) pointing to VITE_API_URL backend server.
 */

import api from '../../api';

const API_BASE = '/api/presentation';
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const presentationApi = {
  /**
   * Request presentation generation from uploaded document or text prompt.
   * @param {FormData|Object} payload
   */
  async generatePresentation(payload) {
    const response = await api.post(`${API_BASE}/generate`, payload);
    return response.data;
  },

  /**
   * Parse document to Universal Semantic JSON.
   * @param {FormData|Object} payload
   */
  async parseDocument(payload) {
    const response = await api.post(`${API_BASE}/parse`, payload);
    return response.data;
  },

  /**
   * Fetch current job progress status.
   * @param {string} jobId
   */
  async getStatus(jobId) {
    const response = await api.get(`${API_BASE}/status/${jobId}`);
    return response.data;
  },

  /**
   * Get direct download link for generated PPTX file.
   * @param {string} jobId
   */
  getDownloadUrl(jobId) {
    return `${BACKEND_URL}/api/presentation/download/${jobId}`;
  },

  /**
   * Fetch presentation preview data.
   * @param {string} jobId
   */
  async getPreview(jobId) {
    const response = await api.get(`${API_BASE}/preview/${jobId}`);
    return response.data;
  },
};
