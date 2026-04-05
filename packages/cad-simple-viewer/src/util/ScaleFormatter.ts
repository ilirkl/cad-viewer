export enum ScaleType {
  Architectural = 'Architectural',
  Engineering = 'Engineering',
  Metric = 'Metric',
  Manual = 'Manual'
}

export interface MeasurementScale {
  type: ScaleType
  label: string
  /**
   * The multiplier converting drawing units to presentation units.
   * DXF raw units typically depend on file, but we assume 1 raw unit = 1 base unit for the scale formula.
   * We need a strategy to display correct strings.
   * 
   * Given drawing is in Points (1/72 inch).
   * For 1/4" = 1'0", 1/4" is 18 points.
   * 18 units = 1 foot.
   * factor = 1/18 foot/unit. Or we can just multiply `drawingUnits * factor` to get base display units.
   */
  factor: number
}

// Predefined Metric Scales. Assuming 1 raw unit = 1 mm on paper.
// If drawing is at 1:100, 1mm on paper = 100mm in reality.
export const METRIC_SCALES: MeasurementScale[] = [
  { type: ScaleType.Metric, label: '1:1', factor: 1 },
  { type: ScaleType.Metric, label: '1:10', factor: 10 },
  { type: ScaleType.Metric, label: '1:20', factor: 20 },
  { type: ScaleType.Metric, label: '1:25', factor: 25 },
  { type: ScaleType.Metric, label: '1:50', factor: 50 },
  { type: ScaleType.Metric, label: '1:75', factor: 75 },
  { type: ScaleType.Metric, label: '1:100', factor: 100 },
  { type: ScaleType.Metric, label: '1:125', factor: 125 },
  { type: ScaleType.Metric, label: '1:150', factor: 150 },
  { type: ScaleType.Metric, label: '1:200', factor: 200 },
  { type: ScaleType.Metric, label: '1:250', factor: 250 },
  { type: ScaleType.Metric, label: '1:500', factor: 500 },
  { type: ScaleType.Metric, label: '1:1000', factor: 1000 },
]

// Predefined Architectural Scales.
// e.g. 1/4" = 1'0". If paper is evaluated in Inches, 1/4 inch = 12 inches (real). Factor = 48.
export const ARCHITECTURAL_SCALES: MeasurementScale[] = [
  { type: ScaleType.Architectural, label: '1/64" = 1\'0"', factor: 192 * 4 }, // 768
  { type: ScaleType.Architectural, label: '1/32" = 1\'0"', factor: 384 },
  { type: ScaleType.Architectural, label: '1/16" = 1\'0"', factor: 192 },
  { type: ScaleType.Architectural, label: '3/32" = 1\'0"', factor: 128 },
  { type: ScaleType.Architectural, label: '1/8" = 1\'0"', factor: 96 },
  { type: ScaleType.Architectural, label: '3/16" = 1\'0"', factor: 64 },
  { type: ScaleType.Architectural, label: '1/4" = 1\'0"', factor: 48 },
  { type: ScaleType.Architectural, label: '3/8" = 1\'0"', factor: 32 },
  { type: ScaleType.Architectural, label: '1/2" = 1\'0"', factor: 24 },
  { type: ScaleType.Architectural, label: '3/4" = 1\'0"', factor: 16 },
  { type: ScaleType.Architectural, label: '1" = 1\'0"', factor: 12 },
  { type: ScaleType.Architectural, label: '1-1/2" = 1\'0"', factor: 8 },
  { type: ScaleType.Architectural, label: '3" = 1\'0"', factor: 4 }
]

// Predefined Engineering Scales.
// e.g. 1" = 10'. 1 inch on paper = 120 inches real. Factor = 120.
export const ENGINEERING_SCALES: MeasurementScale[] = [
  { type: ScaleType.Engineering, label: '1" = 10\'', factor: 120 },
  { type: ScaleType.Engineering, label: '1" = 20\'', factor: 240 },
  { type: ScaleType.Engineering, label: '1" = 30\'', factor: 360 },
  { type: ScaleType.Engineering, label: '1" = 40\'', factor: 480 },
  { type: ScaleType.Engineering, label: '1" = 50\'', factor: 600 },
  { type: ScaleType.Engineering, label: '1" = 60\'', factor: 720 },
  { type: ScaleType.Engineering, label: '1" = 100\'', factor: 1200 }
]

/**
 * Normalizes drawing units to base "paper" inches. 
 * Since the dxfs are generated from pyMuPDF (which works in 1/72" points):
 * 1 CAD unit = 1 Point = 1/72 inch.
 * Therefore, drawing distance * (1/72) = paper inches.
 */
function toPaperInches(distanceUnits: number): number {
  return distanceUnits / 72.0
}

/**
 * Normalizes drawing units to base "paper" millimeters.
 * 1 point = 0.352778 mm.
 */
function toPaperMm(distanceUnits: number): number {
  return distanceUnits * 0.352777778
}

export function formatDistance(distanceUnits: number, scale: MeasurementScale): string {
  if (scale.type === ScaleType.Metric) {
    // raw distance in paper mm * scale factor
    const realMm = toPaperMm(distanceUnits) * scale.factor
    if (realMm >= 1000) {
      return `${(realMm / 1000).toFixed(3)} m`
    }
    return `${realMm.toFixed(1)} mm`
  } 
  
  if (scale.type === ScaleType.Architectural) {
    // real inches
    const realInches = toPaperInches(distanceUnits) * scale.factor
    const feet = Math.floor(realInches / 12)
    const inches = realInches - (feet * 12)
    
    // For fractions, usually architects do down to 1/16, but for viewer a decimal string or approximate fraction is fine.
    // We'll just do decimal inches.
    if (feet === 0) {
      return `${inches.toFixed(2)}"`
    }
    return `${feet}' - ${inches.toFixed(2)}"`
  }

  if (scale.type === ScaleType.Engineering) {
    const realInches = toPaperInches(distanceUnits) * scale.factor
    const feet = realInches / 12
    return `${feet.toFixed(2)} ft`
  }

  if (scale.type === ScaleType.Manual) {
    // Assume custom scale maps 1 drawing unit to X real meters for simplicity.
    const realMeters = distanceUnits * scale.factor
    return `${realMeters.toFixed(3)} m`
  }

  return `${distanceUnits.toFixed(3)}`
}

export function formatArea(areaUnits: number, scale: MeasurementScale): string {
  if (scale.type === ScaleType.Metric) {
    // 1 sq unit = (0.352778 mm)^2. Real area = sq unit * (factor)^2
    const realSqMm = (areaUnits * Math.pow(0.352777778, 2)) * Math.pow(scale.factor, 2)
    if (realSqMm >= 1000000) { // 1 sq meter = 1,000,000 sq mm
      return `${(realSqMm / 1000000).toFixed(3)} m²`
    }
    return `${realSqMm.toFixed(1)} mm²`
  } 
  
  if (scale.type === ScaleType.Architectural || scale.type === ScaleType.Engineering) {
    // 1 sq unit = (1/72 inch)^2
    const sqInches = areaUnits * Math.pow(1 / 72.0, 2) * Math.pow(scale.factor, 2)
    const sqFeet = sqInches / 144.0
    return `${sqFeet.toFixed(2)} sq ft`
  }

  if (scale.type === ScaleType.Manual) {
    const realSqMeters = areaUnits * Math.pow(scale.factor, 2)
    return `${realSqMeters.toFixed(3)} m²`
  }

  return `${areaUnits.toFixed(3)} sq units`
}
