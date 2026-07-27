/**
 * usePipelineProgress.js
 * React hook subscribing to stage progress polling or SSE stream updates for an active presentation job.
 */

import { useEffect } from 'react';
import { presentationApi } from '../services/presentationApi';
import { usePresentationContext } from '../context/PresentationContext';

export function usePipelineProgress(jobId) {
  const { setPipelineProgress, setPresentationData } = usePresentationContext();

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const statusData = await presentationApi.getStatus(jobId);
        if (statusData) {
          setPipelineProgress({
            stage: statusData.stage,
            percentage: statusData.percentage,
            message: statusData.message,
          });

          if (statusData.stage === 'completed') {
            clearInterval(interval);
            const preview = await presentationApi.getPreview(jobId);
            setPresentationData(preview);
          }
        }
      } catch (err) {
        console.error('Error polling pipeline progress:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);
}
