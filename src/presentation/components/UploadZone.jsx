/**
 * UploadZone.jsx
 * Enterprise Drag & Drop File Uploader supporting PDF, DOCX, DOC, TXT, CSV, XLSX, XLS, PNG, JPG.
 */

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';

export function UploadZone({ onFileSelect, activeFile, onRemoveFile }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {!activeFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-gray-300 dark:border-gray-800 hover:border-indigo-400 bg-gray-50/50 dark:bg-gray-900/50'
          }`}
        >
          <input
            type="file"
            onChange={handleChange}
            accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Upload size={28} />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Drag & Drop Document or <span className="text-indigo-600 dark:text-indigo-400 underline">Browse</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supports PDF, DOCX, DOC, TXT, CSV, XLSX, XLS, PNG, JPG (up to 50MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs">
                {activeFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(activeFile.size / (1024 * 1024)).toFixed(2)} MB • {activeFile.type || 'Document'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="p-2 text-gray-500 hover:text-indigo-600 cursor-pointer" title="Replace File">
              <RefreshCw size={16} />
              <input type="file" onChange={handleChange} className="hidden" />
            </label>
            <button
              onClick={onRemoveFile}
              className="p-2 text-gray-400 hover:text-red-500 transition"
              title="Remove File"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
