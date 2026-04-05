import { reactive } from 'vue'

export interface PdfPageInfo {
  page: number
  dxf: string
  png: string
  width_px: number
  height_px: number
  width_pts: number
  height_pts: number
  dxf_absolute_path: string
  png_absolute_path: string
}

export const store = reactive({
  fileName: '',
  dialogs: {
    layerManager: false
  },
  pdfPages: [] as PdfPageInfo[],
  activePdfPage: 1,
  /** Cached DXF ArrayBuffers keyed by page number — avoids re-reading from disk */
  dxfDataCache: new Map<number, ArrayBuffer>(),
  /** Cached convertFileSrc PNG URLs keyed by page number — avoids re-computing */
  pngUrlCache: new Map<number, string>()
})
