/**
 * usePresentationGenerator.js
 * React hook orchestrating document submission, progress tracking, and presentation rendering pipeline execution.
 */

import { useState } from 'react';
import { presentationApi } from '../services/presentationApi';
import { usePresentationContext } from '../context/PresentationContext';

export function usePresentationGenerator() {
  const { setActiveJobId, setPipelineProgress, setPresentationData } = usePresentationContext();
  const [loading, setLoading] = useState(false);

  const startGeneration = async (fileOrTextPayload) => {
    setLoading(true);
    try {
      const response = await presentationApi.generatePresentation(fileOrTextPayload);
      if (response?.jobId) {
        setActiveJobId(response.jobId);
      }
      return response;
    } catch (err) {
      console.error('Presentation generation request failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    startGeneration,
    loading,
  };
}
