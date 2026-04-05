<template>
  <div id="app-root">
    <!-- Upload screen when no file is selected -->
    <div v-if="!store.selectedFile" class="upload-screen">
      <FileUpload @file-select="handleFileSelect" />
    </div>

    <!-- CAD viewer when file is selected -->
    <div v-else>
      <MlCadViewer
        locale="en"
        :local-file="store.selectedFile"
        :mode="selectedMode"
        @create="initialize"
        base-url="https://cdn.jsdelivr.net/gh/mlightcad/cad-data@main/"
      />
    </div>

    <!-- PDF conversion loading overlay -->
    <Transition name="fade">
      <div v-if="isConverting" class="pdf-loading-overlay">
        <div class="pdf-loading-card">
          <div class="pdf-spinner"></div>
          <h3 class="pdf-loading-title">Converting PDF</h3>
          <p class="pdf-loading-text">{{ loadingMessage }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// import { AcApSettingManager } from '@mlightcad/cad-simple-viewer'
import {
  AcApDocManager,
  AcEdCommandStack,
  AcEdOpenMode
} from '@mlightcad/cad-simple-viewer'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import { provide, ref } from 'vue'

import { AcApQuitCmd } from './commands'
import FileUpload from './components/FileUpload.vue'
import { initializeLocale } from './locale'
import { store } from './store'

const isConverting = ref(false)
const loadingMessage = ref('Preparing extraction engine...')

// Provide the loading state so MlCadViewer can update it
provide('pdfConversionState', { isConverting, loadingMessage })

const initialize = () => {
  initializeLocale()
  const register = AcApDocManager.instance.commandManager
  register.addCommand(
    AcEdCommandStack.SYSTEMT_COMMAND_GROUP_NAME,
    'quit',
    'quit',
    new AcApQuitCmd()
  )
  register.addCommand(
    AcEdCommandStack.SYSTEMT_COMMAND_GROUP_NAME,
    'exit',
    'exit',
    new AcApQuitCmd()
  )
}

// Decide whether to show command line vertical toolbar at the right side,
// performance stats, coordinates in status bar, etc.
// AcApSettingManager.instance.isShowCommandLine = false
// AcApSettingManager.instance.isShowToolbar = false
// AcApSettingManager.instance.isShowStats = false
// AcApSettingManager.instance.isShowCoordinate = false

const selectedMode = ref<AcEdOpenMode>(AcEdOpenMode.Read)

// Handle file selection from upload component
const handleFileSelect = async (file: File, mode: AcEdOpenMode) => {
  // Show loading overlay immediately for PDF files
  if (file.name.toLowerCase().endsWith('.pdf')) {
    isConverting.value = true
    loadingMessage.value = 'Preparing extraction engine...'
    // Yield to the browser to paint the loading state
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  store.selectedFile = file
  selectedMode.value = mode
}
</script>

<style scoped>
#app-root {
  height: 100vh;
  position: fixed;
}

.upload-screen {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: auto; /* Allow clicks on upload screen */
}

/* PDF Conversion Loading Overlay */
.pdf-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.pdf-loading-card {
  background: rgba(30, 30, 46, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
}

.pdf-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.15);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pdf-loading-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.3px;
}

.pdf-loading-text {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

