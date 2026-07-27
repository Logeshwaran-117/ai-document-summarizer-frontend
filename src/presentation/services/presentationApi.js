/**
 * presentationApi.js
 * Frontend Service Client for AI Presentation Generation API endpoints.
 * Explicitly constructs absolute target backend URLs to guarantee requests reach the backend API server.
 */

import api from '../../api';

const RAW_BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BACKEND_URL = RAW_BACKEND.endsWith('/') ? RAW_BACKEND.slice(0, -1) : RAW_BACKEND;

/**
 * Returns full absolute API URL targeting backend server.
 * @param {string} endpointPath 
 */
function getEndpointUrl(endpointPath) {
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  if (BACKEND_URL.startsWith('http://') || BACKEND_URL.startsWith('https://')) {
    return `${BACKEND_URL}${path}`;
  }
  return path;
}

export const presentationApi = {
  /**
   * Request presentation generation from uploaded document or text prompt.
   * @param {FormData|Object} payload
   */
  async generatePresentation(payload) {
    const url = getEndpointUrl('/api/presentation/generate');
    const response = await api.post(url, payload);
    return response.data;
  },

  /**
   * Parse document to Universal Semantic JSON.
   * @param {FormData|Object} payload
   */
  async parseDocument(payload) {
    const url = getEndpointUrl('/api/presentation/parse');
    const response = await api.post(url, payload);
    return response.data;
  },

  /**
   * Fetch current job progress status.
   * @param {string} jobId
   */
  async getStatus(jobId) {
    const url = getEndpointUrl(`/api/presentation/status/${jobId}`);
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get direct download link for generated PPTX file.
   * @param {string} jobId
   */
  getDownloadUrl(jobId) {
    return getEndpointUrl(`/api/presentation/download/${jobId}`);
  },

  /**
   * Fetch presentation preview data.
   * @param {string} jobId
   */
  async getPreview(jobId) {
    const url = getEndpointUrl(`/api/presentation/preview/${jobId}`);
    const response = await api.get(url);
    return response.data;
  },
};
