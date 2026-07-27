/**
 * PipelineProgressIndicator.jsx
 * UI Component displaying multi-stage pipeline status (Parsing -> Intelligence -> Planning -> Rendering -> Validation).
 */

import React from 'react';

export function PipelineProgressIndicator({ stage, percentage, message }) {
  return (
    <div className="pipeline-progress-box">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="progress-status">
        <span>Stage: {stage}</span>
        <span>{percentage}%</span>
      </div>
      <p className="progress-message">{message}</p>
    </div>
  );
}
