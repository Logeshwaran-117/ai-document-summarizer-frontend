/**
 * PresentationPreviewer.jsx
 * Interactive 16:9 widescreen canvas slide previewer component.
 * Renders slides in exact accordance with DESIGN_CONSTITUTION.md.
 */

import React from 'react';
import { CONSTITUTION_THEME } from '../utils/constitutionTheme';

export function PresentationPreviewer({ slides, activeIndex, onSelectSlide }) {
  if (!slides || slides.length === 0) {
    return <div className="previewer-empty">No presentation deck generated yet.</div>;
  }

  const currentSlide = slides[activeIndex] || slides[0];

  return (
    <div className="presentation-preview-stage">
      <div 
        className="slide-canvas-16-9"
        style={{
          aspectRatio: CONSTITUTION_THEME.CANVAS.ASPECT_RATIO,
          backgroundColor: CONSTITUTION_THEME.COLORS.LIGHT_BG,
          fontFamily: CONSTITUTION_THEME.FONTS.FAMILY,
          fontWeight: CONSTITUTION_THEME.FONTS.WEIGHT,
        }}
      >
        {/* 16:9 Canvas Slide Visual Rendering Target */}
        <div className="slide-header-bar" style={{ backgroundColor: CONSTITUTION_THEME.COLORS.DEEP_NAVY }}>
          <h2 style={{ color: CONSTITUTION_THEME.COLORS.WHITE }}>{currentSlide?.header?.title}</h2>
          <h3 style={{ color: CONSTITUTION_THEME.COLORS.AMBER_GOLD }}>{currentSlide?.header?.subtitle}</h3>
        </div>
      </div>
    </div>
  );
}
