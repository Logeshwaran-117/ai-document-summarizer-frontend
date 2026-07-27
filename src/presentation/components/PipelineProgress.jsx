/**
 * PipelineProgress.jsx
 * Pipeline stage status indicator displaying the 11 AI stages.
 */

import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

const STAGES = [
  { key: 'parsing', label: 'Document Parsing' },
  { key: 'intelligence', label: 'Document Intelligence' },
  { key: 'semanticJson', label: 'Semantic JSON' },
  { key: 'strategy', label: 'Presentation Strategy' },
  { key: 'outline', label: 'Outline Generation' },
  { key: 'content', label: 'Content Generation' },
  { key: 'visualPlanning', label: 'Visual Planning' },
  { key: 'layoutPlanning', label: 'Layout Planning' },
  { key: 'rendering', label: 'Rendering Engine' },
  { key: 'validation', label: 'Validation Audit' },
  { key: 'export', label: 'PPTX Binary Export' },
];

export function PipelineProgress({ currentStageIndex = 0, status = 'idle' }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
        <span>AI Pipeline Execution</span>
        <span>Stage {Math.min(currentStageIndex + 1, STAGES.length)} of {STAGES.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
        {STAGES.map((stg, idx) => {
          const isDone = idx < currentStageIndex || status === 'completed';
          const isCurrent = idx === currentStageIndex && status === 'processing';

          return (
            <div
              key={stg.key}
              className={`flex items-center gap-2.5 p-2 rounded-lg text-xs transition ${
                isCurrent
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800'
                  : isDone
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              ) : isCurrent ? (
                <Loader2 size={15} className="text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
              ) : (
                <Circle size={15} className="shrink-0" />
              )}
              <span>{stg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
