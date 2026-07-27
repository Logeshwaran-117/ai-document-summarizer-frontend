/**
 * presentationTypes.js
 * Frontend Data Models and JSDoc Contracts for AI Presentation Generator.
 * Aligned with DESIGN_CONSTITUTION.md
 */

/**
 * @typedef {Object} PresentationSlide
 * @property {number} slideIndex
 * @property {string} slideType - TYPE_1_COVER | TYPE_2_SECTION_DIVIDER | TYPE_3_KPI_GRID | TYPE_4_DATA_TABLE | TYPE_5_SINGLE_CHART | TYPE_6_DUAL_CHART | TYPE_7_RECOMMENDATION | TYPE_8_SUMMARY_CLOSING
 * @property {Object} header
 * @property {string} header.title - ALL CAPS, max 8 words
 * @property {string} header.subtitle - Amber Gold (#F5A800) subtitle, max 12 words
 * @property {Array<Object>} components - Cards, tables, charts, or bullet blocks
 * @property {Object} [chartConfig] - PptxGenJS chart configuration if slide includes chart
 */

/**
 * @typedef {Object} PipelineProgressState
 * @property {string} jobId
 * @property {'idle'|'parsing'|'intelligence'|'planning'|'rendering'|'validating'|'completed'|'error'} stage
 * @property {number} percentage - 0 to 100
 * @property {string} message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {Array<{ rule: string, details: string, slideIndex: number }>} violations
 */

export {};
