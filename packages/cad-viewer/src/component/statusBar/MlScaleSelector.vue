<template>
  <el-tooltip :content="'Measurement Scale'" :hide-after="0">
    <el-dropdown
      class="ml-status-bar-scale-selector"
      trigger="click"
      placement="top"
      @command="handleSelectScale"
    >
      <el-button class="ml-status-bar-scale-btn" :icon="ScaleToOriginal" />
      <template #dropdown>
        <el-dropdown-menu class="ml-scale-dropdown-menu">
          <!-- Manual Calibration Group -->
          <div class="ml-scale-group-title">MANUAL CALIBRATION</div>
          <el-dropdown-item :command="{ type: 'Manual' }">
            <el-icon><CopyDocument /></el-icon> Calibrate Scale
          </el-dropdown-item>
          
          <el-divider class="ml-scale-divider" />

          <!-- Architectural Group -->
          <div class="ml-scale-group-title">ARCHITECTURAL</div>
          <el-dropdown-item 
            v-for="(scale, index) in architecturalScales" 
            :key="'arch-'+index"
            :command="scale"
            :class="{ 'is-active': isCurrentScale(scale) }"
          >
            {{ scale.label }}
          </el-dropdown-item>
          
          <el-divider class="ml-scale-divider" />

          <!-- Engineering Group -->
          <div class="ml-scale-group-title">ENGINEERING</div>
          <el-dropdown-item 
            v-for="(scale, index) in engineeringScales" 
            :key="'eng-'+index"
            :command="scale"
            :class="{ 'is-active': isCurrentScale(scale) }"
          >
            {{ scale.label }}
          </el-dropdown-item>
          
          <el-divider class="ml-scale-divider" />

          <!-- Metric Group -->
          <div class="ml-scale-group-title">METRIC</div>
          <el-dropdown-item 
            v-for="(scale, index) in metricScales" 
            :key="'met-'+index"
            :command="scale"
            :class="{ 'is-active': isCurrentScale(scale) }"
          >
            {{ scale.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </el-tooltip>
</template>

<script setup lang="ts">
import { CopyDocument, ScaleToOriginal } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { 
  AcApSettingManager,
  type MeasurementScale, 
  ARCHITECTURAL_SCALES, 
  ENGINEERING_SCALES, 
  METRIC_SCALES 
} from '@mlightcad/cad-simple-viewer'
import { useSettings } from '../../composable'

const architecturalScales = ARCHITECTURAL_SCALES || []
const engineeringScales = ENGINEERING_SCALES || []
const metricScales = METRIC_SCALES || []

const settings = useSettings()

const currentScale = computed(() => {
  return settings.measurementScale || METRIC_SCALES?.[0]
})

const isCurrentScale = (scale: MeasurementScale) => {
  return currentScale.value?.type === scale.type && currentScale.value?.label === scale.label
}

const handleSelectScale = (scale: MeasurementScale | { type: string }) => {
  if (scale.type === 'Manual') {
    // TODO: Trigger manual calibration command
    console.log('Manual calibration triggered')
    return
  }
  AcApSettingManager.instance.measurementScale = scale as MeasurementScale
}
</script>

<style scoped>
.ml-status-bar-scale-selector {
  display: flex;
  height: 100%;
}

.ml-status-bar-scale-btn {
  border: none;
  padding: 0px;
  cursor: pointer;
  width: 30px;
  height: 100%;
}

.ml-scale-dropdown-menu {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.ml-scale-group-title {
  padding: 4px 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.ml-scale-divider {
  margin: 8px 0;
}

.is-active {
  color: var(--el-color-primary);
  font-weight: bold;
  background-color: var(--el-color-primary-light-9);
}
</style>
