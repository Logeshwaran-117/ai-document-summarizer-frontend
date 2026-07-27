/**
 * PresentationContext.jsx
 * React Context Provider for global AI Presentation Generator state management.
 */

import React, { createContext, useContext, useState } from 'react';

const PresentationContext = createContext(null);

export const PresentationProvider = ({ children }) => {
  const [activeJobId, setActiveJobId] = useState(null);
  const [pipelineProgress, setPipelineProgress] = useState({
    stage: 'idle',
    percentage: 0,
    message: '',
  });
  const [presentationData, setPresentationData] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  const value = {
    activeJobId,
    setActiveJobId,
    pipelineProgress,
    setPipelineProgress,
    presentationData,
    setPresentationData,
    validationReport,
    setValidationReport,
  };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
};

export const usePresentationContext = () => {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error('usePresentationContext must be used within a PresentationProvider');
  }
  return context;
};
