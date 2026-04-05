<template>
  <div class="ml-page-list-container">
    <div v-if="store.pdfPages.length === 0" class="no-pages">
      <!-- Empty state when no PDF is loaded or PDF has no pages -->
      No PDF pages available.
    </div>
    <div v-else class="page-list">
      <div 
        v-for="p in store.pdfPages" 
        :key="p.page"
        class="page-item"
        :class="{ 'is-active': p.page === store.activePdfPage }"
        @click="switchPage(p)"
      >
        <div class="page-icon">
          <!-- generic file/page icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div class="page-info">
          Page {{ p.page }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AcApDocManager } from '@mlightcad/cad-simple-viewer'
import { ref } from 'vue'
import { store, PdfPageInfo } from '../../app'
import { ElMessage } from 'element-plus'

const isSwitching = ref(false)

const switchPage = async (page: PdfPageInfo) => {
  if (isSwitching.value || page.page === store.activePdfPage) return

  try {
    isSwitching.value = true
    store.activePdfPage = page.page

    // Use cached DXF data (pre-read during initial PDF import)
    let dxfBuffer = store.dxfDataCache.get(page.page)

    // Fallback: read from disk if cache miss (shouldn't normally happen)
    if (!dxfBuffer) {
      if ('__TAURI_INTERNALS__' in window) {
        const { readFile } = await import('@tauri-apps/plugin-fs')
        const dxfData = await readFile(page.dxf_absolute_path)
        dxfBuffer = dxfData.buffer as ArrayBuffer
        store.dxfDataCache.set(page.page, dxfBuffer)
      } else {
        throw new Error('PDF capabilities are only supported in Tauri Desktop.')
      }
    }

    const successLoad = await AcApDocManager.instance.openDocument(
      page.dxf,
      dxfBuffer,
      { minimumChunkSize: 1000, mode: 8 }
    )

    if (!successLoad) {
      throw new Error('Failed to load page DXF')
    }

    store.fileName = AcApDocManager.instance.curDocument.docTitle

    // Use cached PNG URL (pre-computed during initial PDF import)
    let assetUrl = store.pngUrlCache.get(page.page)

    // Fallback: compute from path if cache miss
    if (!assetUrl && '__TAURI_INTERNALS__' in window) {
      const { convertFileSrc } = await import('@tauri-apps/api/core')
      assetUrl = convertFileSrc(page.png_absolute_path)
      store.pngUrlCache.set(page.page, assetUrl)
    }

    if (assetUrl) {
      const view = AcApDocManager.instance.curView as any
      if (view.setBackgroundImage) {
        view.setBackgroundImage(assetUrl, page.width_pts, page.height_pts)
      }
    }

    // Auto zoom to fit so the new page is immediately visible
    AcApDocManager.instance.curView?.zoomToFitDrawing()
  } catch (error: any) {
    console.error('Error switching page:', error)
    ElMessage.error(`Failed to switch page: ${error.message}`)
  } finally {
    isSwitching.value = false
  }
}
</script>

<style scoped>
.ml-page-list-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.no-pages {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.page-list {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
}

.page-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  color: var(--el-text-color-regular);
}

.page-item:hover {
  background-color: var(--el-fill-color-light);
}

.page-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.page-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-icon svg {
  width: 16px;
  height: 16px;
}

.page-info {
  font-size: 13px;
  font-weight: 500;
  user-select: none;
}
</style>
