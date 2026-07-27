/**
 * PreviewPanel.jsx
 * Interactive 16:9 Slide Previewer Canvas with thumbnail navigation and zoom controls.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Download, Eye } from 'lucide-react';
import { CONSTITUTION_THEME } from '../utils/constitutionTheme';
import { SlideThumbnail } from './SlideThumbnail';

export function PreviewPanel({ slides = [], activeIndex = 0, onSelectSlide, onDownloadPptx }) {
  const [zoom, setZoom] = useState(1.0);

  if (!slides || slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-6 text-center bg-gray-50/50 dark:bg-gray-900/50">
        <Eye size={36} className="text-gray-400 mb-2" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Presentation Deck Generated Yet</p>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          Upload a document and click "Generate Presentation" to preview 16:9 widescreen slides.
        </p>
      </div>
    );
  }

  const currentSlide = slides[activeIndex] || slides[0];

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
      {/* Top Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800 text-xs">
        <div className="flex items-center gap-2 text-gray-300 font-medium">
          <span>Slide {activeIndex + 1} of {slides.length}</span>
          <span className="text-gray-600">•</span>
          <span className="text-amber-400 font-semibold">{currentSlide.slideType || 'Slide'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-gray-400 text-[11px] w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-gray-700">|</span>
          <button
            onClick={onDownloadPptx}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded-lg transition"
          >
            <Download size={14} /> Download PPTX
          </button>
        </div>
      </div>

      {/* Main Canvas Stage + Thumbnails Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Thumbnails List */}
        <div className="w-48 bg-gray-950/80 border-r border-gray-800 p-3 space-y-2.5 overflow-y-auto shrink-0">
          {slides.map((s, idx) => (
            <SlideThumbnail
              key={idx}
              slide={s}
              index={idx}
              isActive={idx === activeIndex}
              onClick={() => onSelectSlide(idx)}
            />
          ))}
        </div>

        {/* 16:9 Canvas Stage */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-gray-900/60">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
            }}
            className="relative w-[800px] h-[450px] bg-[#F2F4F8] rounded-xl shadow-2xl overflow-hidden border border-gray-300 flex flex-col justify-between"
          >
            {/* Slide Header Bar */}
            <div className="w-full bg-[#1A2B4A] px-6 py-4 flex flex-col justify-center shadow-md">
              <h2 className="text-lg font-bold text-white tracking-wide uppercase line-clamp-1">
                {currentSlide.title || 'SLIDE TITLE'}
              </h2>
              <p className="text-xs font-semibold text-[#F5A800] mt-0.5 line-clamp-1">
                {currentSlide.subtitle || 'Executive Subtitle Statement'}
              </p>
            </div>

            {/* Slide Body Content */}
            <div className="flex-1 p-6 flex flex-col justify-start space-y-3">
              {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                <div className="space-y-2">
                  {currentSlide.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2 text-xs font-bold text-[#1A2B4A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A7B8C] mt-1.5 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              {currentSlide.callouts && currentSlide.callouts.length > 0 && (
                <div className="mt-2 p-3 bg-white border-l-4 border-[#0A7B8C] rounded shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-[#6B7A99] font-semibold">
                    {currentSlide.callouts[0]?.type || 'Highlight'}
                  </p>
                  <p className="text-sm font-bold text-[#0A7B8C]">
                    {currentSlide.callouts[0]?.label}: {currentSlide.callouts[0]?.value}
                  </p>
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="px-6 py-2 flex items-center justify-between text-[10px] text-[#6B7A99] font-bold">
              <span>CONFIDENTIAL</span>
              <span>{String(activeIndex + 1).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-2 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
        <button
          disabled={activeIndex === 0}
          onClick={() => onSelectSlide(Math.max(0, activeIndex - 1))}
          className="flex items-center gap-1 hover:text-white disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span>
          Slide {activeIndex + 1} of {slides.length}
        </span>
        <button
          disabled={activeIndex === slides.length - 1}
          onClick={() => onSelectSlide(Math.min(slides.length - 1, activeIndex + 1))}
          className="flex items-center gap-1 hover:text-white disabled:opacity-30 cursor-pointer"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
