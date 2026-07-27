/**
 * ValidationReportView.jsx
 * UI Component displaying design constitution validation compliance checks (15 immutable rules).
 */

import React from 'react';

export function ValidationReportView({ report }) {
  if (!report) return null;

  return (
    <div className="validation-report-card">
      <h4>Design Constitution Compliance Audit</h4>
      <div className={`status-pill ${report.isValid ? 'pass' : 'fail'}`}>
        {report.isValid ? '100% Constitution Compliant' : 'Violations Detected'}
      </div>
      {report.violations?.map((v, i) => (
        <div key={i} className="violation-item">
          <strong>Slide #{v.slideIndex + 1}:</strong> {v.rule} — {v.details}
        </div>
      ))}
    </div>
  );
}
