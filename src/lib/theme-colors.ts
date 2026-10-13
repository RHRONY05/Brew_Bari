// Canvas drawing and the QR library can't use CSS variables, so read the
// current theme's colours from the document. Theme colour tokens must be hex.

export interface CanvasColors {
  ink: string
  brand: string
  surface: string
  paper: string
  paperLine: string
  paperInk: string
}

export function readThemeColors(): CanvasColors {
  const fallback: CanvasColors = {
    ink: '#24170F',
    brand: '#6B4226',
    surface: '#FFFFFF',
    paper: '#FAF7F2',
    paperLine: '#E6DFD5',
    paperInk: '#8C7E74',
  }
  if (typeof document === 'undefined') return fallback
  const cs = getComputedStyle(document.documentElement)
  const read = (name: string, fb: string) => cs.getPropertyValue(`--${name}`).trim() || fb
  return {
    ink: read('ink', fallback.ink),
    brand: read('brand', fallback.brand),
    surface: read('surface', fallback.surface),
    paper: read('paper', fallback.paper),
    paperLine: read('paper-line', fallback.paperLine),
    paperInk: read('paper-ink', fallback.paperInk),
  }
}
