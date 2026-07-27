/**
 * TemplateCard.jsx
 * Pre-baked Presentation Template Card component.
 */

import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

export function TemplateCard({ template, onSelect }) {
  return (
    <div
      onClick={() => onSelect(template)}
      className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-xl transition-all hover:border-indigo-500 flex flex-col justify-between"
    >
      <div>
        <div
          className="w-full h-32 rounded-xl mb-4 p-4 flex flex-col justify-between text-white font-bold text-sm shadow-md"
          style={{ background: template.gradient || 'linear-gradient(135deg, #1A2B4A, #F5A800)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{template.category}</span>
          <span className="text-lg line-clamp-2">{template.title}</span>
          <span className="text-[10px] opacity-75">{template.slideCount} Slides</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{template.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{template.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition">
        <span>Use Template</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}
