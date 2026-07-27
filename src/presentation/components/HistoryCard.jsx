/**
 * HistoryCard.jsx
 * Presentation History List Item Card.
 */

import React from 'react';
import { Presentation, Download, Trash2, Calendar, FileText } from 'lucide-react';
import { presentationApi } from '../services/presentationApi';

export function HistoryCard({ item, onDelete }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <Presentation size={20} />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{item.name || 'Executive Presentation'}</h4>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span className="flex items-center gap-1"><Calendar size={12} /> {item.date || 'Recent'}</span>
            <span>•</span>
            <span>{item.slideCount || 10} Slides</span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold">{item.status || 'Completed'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={presentationApi.getDownloadUrl(item.jobId)}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition"
        >
          <Download size={14} /> PPTX
        </a>
        <button
          onClick={() => onDelete(item.jobId)}
          className="p-2 text-gray-400 hover:text-red-500 transition"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
