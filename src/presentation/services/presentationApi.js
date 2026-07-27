/**
 * presentationApi.js
 * Frontend Service Client for AI Presentation Generation API endpoints.
 */

import axios from 'axios';

const API_BASE = '/api/presentation';

export const presentationApi = {
  /**
   * Request presentation generation from uploaded document or text prompt.
   * @param {FormData|Object} payload
   */
  async generatePresentation(payload) {
    const response = await axios.post(`${API_BASE}/generate`, payload);
    return response.data;
  },

  /**
   * Fetch current job progress status.
   * @param {string} jobId
   */
  async getStatus(jobId) {
    const response = await axios.get(`${API_BASE}/status/${jobId}`);
    return response.data;
  },

  /**
   * Get direct download link for generated PPTX file.
   * @param {string} jobId
   */
  getDownloadUrl(jobId) {
    return `${API_BASE}/download/${jobId}`;
  },

  /**
   * Fetch presentation preview data.
   * @param {string} jobId
   */
  async getPreview(jobId) {
    const response = await axios.get(`${API_BASE}/preview/${jobId}`);
    return response.data;
  },
};
