/**
 * SlideThumbnail.jsx
 * Sidebar slide thumbnail element.
 */

import React from 'react';

export function SlideThumbnail({ slide, index, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-lg p-2 border text-left transition ${
        isActive
          ? 'border-amber-400 bg-amber-500/10 text-white shadow-md'
          : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
        <span className="text-gray-500">#{index + 1}</span>
        <span className="truncate max-w-[90px]">{slide.slideType || 'Slide'}</span>
      </div>
      <div className="w-full h-16 bg-[#F2F4F8] rounded overflow-hidden flex flex-col justify-between p-1.5 text-[8px] text-[#1A2B4A]">
        <div className="bg-[#1A2B4A] text-white p-1 rounded font-bold truncate">
          {slide.title || `Slide ${index + 1}`}
        </div>
        <div className="flex justify-between items-center text-[7px] text-[#6B7A99]">
          <span>16:9</span>
          <span>{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}
