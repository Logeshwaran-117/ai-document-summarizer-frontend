/**
 * presentationStore.js
 * Store repository for UI state, current slide index selection, and deck preview states.
 */

class PresentationStore {
  constructor() {
    this.selectedSlideIndex = 0;
    this.zoomLevel = 1.0;
    this.previewMode = 'interactive'; // 'interactive' | 'grid' | 'validation'
  }

  setSelectedSlide(index) {
    this.selectedSlideIndex = index;
  }

  setPreviewMode(mode) {
    this.previewMode = mode;
  }
}

export const presentationStore = new PresentationStore();
