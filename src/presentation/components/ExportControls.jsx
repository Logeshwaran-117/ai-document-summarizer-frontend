/**
 * ExportControls.jsx
 * Export toolbar component with options for PPTX download, PDF preview download, and JSON payload export.
 */

import React from 'react';

export function ExportControls({ jobId, onExportPptx, onExportPdf }) {
  return (
    <div className="export-toolbar">
      <button className="btn-primary" onClick={onExportPptx}>Download PPTX</button>
      <button className="btn-secondary" onClick={onExportPdf}>Download PDF</button>
    </div>
  );
}
