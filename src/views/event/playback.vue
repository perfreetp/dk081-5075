<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">历史回溯</div>
      <div class="header-actions">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>导出录像
        </el-button>
        <el-button @click="handleSnapshot">
          <el-icon><Picture /></el-icon>截图
        </el-button>
      </div>
    </div>
    
    <div class="playback-layout">
      <div class="playback-main">
        <el-card class="video-card">
          <div class="video-player">
            <img :src="videoThumb" alt="" />
            <div class="play-overlay" v-if="!isPlaying" @click="handlePlay">
              <el-icon class="play-icon"><VideoPlay /></el-icon>
              <span>点击播放</span>
            </div>
            <div class="video-info">
              <span class="device-name">{{ selectedDevice?.name || '请选择设备' }}</span>
              <span class="play-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
            </div>
          </div>
          
          <div class="playback-controls">
            <div class="control-left">
              <el-button circle @click="handleBackward">
                <el-icon><Rewind /></el-icon>
              </el-button>
              <el-button type="primary" circle size="large" @click="togglePlay">
                <el-icon v-if="isPlaying"><VideoPause /></el-icon>
                <el-icon v-else><VideoPlay /></el-icon>
              </el-button>
              <el-button circle @click="handleForward">
                <el-icon><FastForward /></el-icon>
              </el-button>
            </div>
            
            <div class="control-center">
              <div class="time-scale">
                <div class="scale-bar">
                  <div class="scale-progress" :style="{ width: progressPercent + '%' }"></div>
                  <div 
                    class="scale-handle" 
                    :style="{ left: progressPercent + '%' }"
                    @mousedown="startDrag"
                  ></div>
                  <div 
                    v-for="segment in videoSegments" 
                    :key="segment.id"
                    class="video-segment"
                    :style="{ 
                      left: segment.startPercent + '%', 
                      width: (segment.endPercent - segment.startPercent) + '%' 
                    }"
                    :class="segment.type"
                  ></div>
                </div>
                <div class="scale-labels">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>
            
            <div class="control-right">
              <div class="speed-control">
                <span class="speed-label">倍速</span>
                <el-select v-model="playSpeed" size="small" style="width: 80px;">
                  <el-option label="0.5x" value="0.5" />
                  <el-option label="1x" value="1" />
                  <el-option label="2x" value="2" />
                  <el-option label="4x" value="4" />
                  <el-option label="8x" value="8" />
                </el-select>
              </div>
              <el-button circle @click="handleFullscreen">
                <el-icon><FullScreen /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
        
        <el-card class="timeline-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">录像时间轴</span>
              <div class="date-picker">
                <el-date-picker
                  v-model="selectedDate"
                  type="date"
                  size="small"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </div>
            </div>
          </template>
          <div class="timeline-container">
            <div class="timeline-header">
              <span class="timeline-label">24小时录像分布</span>
              <div class="legend">
                <span class="legend-item">
                  <span class="dot normal"></span>常规录像
                </span>
                <span class="legend-item">
                  <span class="dot alarm"></span>告警录像
                </span>
                <span class="legend-item">
                  <span class="dot motion"></span>移动侦测
                </span>
              </div>
            </div>
            <div class="timeline-track">
              <div 
                v-for="segment in videoSegments" 
                :key="segment.id"
                class="track-segment"
                :class="segment.type"
                :style="{ 
                  left: segment.startPercent + '%', 
                  width: (segment.endPercent - segment.startPercent) + '%' 
                }"
                @click="seekTo(segment.startTime)"
              >
                <el-tooltip :content="`${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`">
                  <span>{{ segment.label }}</span>
                </el-tooltip>
              </div>
            </div>
            <div class="timeline-labels">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>24:00</span>
            </div>
          </div>
        </el-card>
      </div>
      
      <div class="playback-sidebar">
        <el-card class="side-card">
          <template #header>
            <span class="card-title">选择设备</span>
          </template>
          <el-input
            v-model="searchText"
            placeholder="搜索设备"
            size="small"
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <div class="device-list">
            <div 
              v-for="device in filteredDevices" 
              :key="device.id"
              class="device-item"
              :class="{ active: selectedDevice?.id === device.id }"
              @click="selectDevice(device)"
            >
              <div class="device-status">
                <span class="status-dot" :class="device.status"></span>
              </div>
              <div class="device-info">
                <div class="device-name">{{ device.name }}</div>
                <div class="device-org">{{ device.org }}</div>
              </div>
              <el-button type="primary" size="small" text>
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
        
        <el-card class="side-card">
          <template #header>
            <span class="card-title">快捷回放</span>
          </template>
          <div class="quick-list">
            <div class="quick-item" @click="quickPlay('30min')">
              <el-icon><Clock /></el-icon>
              <span>近30分钟</span>
            </div>
            <div class="quick-item" @click="quickPlay('1hour')">
              <el-icon><Timer /></el-icon>
              <span>近1小时</span>
            </div>
            <div class="quick-item" @click="quickPlay('3hour')">
              <el-icon><TimerFilled /></el-icon>
              <span>近3小时</span>
            </div>
            <div class="quick-item" @click="quickPlay('today')">
              <el-icon><Calendar /></el-icon>
              <span>今日录像</span>
            </div>
          </div>
        </el-card>
        
        <el-card class="side-card">
          <template #header>
            <span class="card-title">关联告警</span>
          </template>
          <div class="alarm-list">
            <div 
              v-for="alarm in relatedAlarms" 
              :key="alarm.id"
              class="alarm-item"
              :class="alarm.level"
              @click="playAlarmVideo(alarm)"
            >
              <div class="alarm-time">{{ alarm.time.split(' ')[1] }}</div>
              <div class="alarm-info">
                <div class="alarm-type">{{ alarm.type }}</div>
                <div class="alarm-desc">{{ alarm.description }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { deviceList, alarmList } from '@/mock/data'

const searchText = ref('')
const selectedDevice = ref(null)
const selectedDate = ref('2024-01-15')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(86400)
const playSpeed = ref('1')
let playTimer = null

const videoSegments = ref([
  { id: 1, type: 'normal', startTime: 0, endTime: 28800, startPercent: 0, endPercent: 33.3, label: '常规录像' },
  { id: 2, type: 'alarm', startTime: 28800, endTime: 32400, startPercent: 33.3, endPercent: 37.5, label: '入侵告警' },
  { id: 3, type: 'normal', startTime: 32400, endTime: 43200, startPercent: 37.5, endPercent: 50, label: '常规录像' },
  { id: 4, type: 'motion', startTime: 43200, endTime: 46800, startPercent: 50, endPercent: 54.2, label: '移动侦测' },
  { id: 5, type: 'normal', startTime: 46800, endTime: 57600, startPercent: 54.2, endPercent: 66.7, label: '常规录像' },
  { id: 6, type: 'alarm', startTime: 57600, endTime: 61200, startPercent: 66.7, endPercent: 70.8, label: '人员聚集' },
  { id: 7, type: 'normal', startTime: 61200, endTime: 86400, startPercent: 70.8, endPercent: 100, label: '常规录像' }
])

const filteredDevices = computed(() => {
  if (!searchText.value) return deviceList.slice(0, 8)
  return deviceList.filter(d => 
    d.name.includes(searchText.value) || d.org.includes(searchText.value)
  ).slice(0, 8)
})

const relatedAlarms = computed(() => {
  return alarmList.slice(0, 5)
})

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const videoThumb = computed(() => {
  const name = selectedDevice.value?.name || '请选择设备'
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect fill='%23000' width='800' height='450'/%3E%3Ctext fill='%23fff' font-size='20' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(name)} - 历史回放%3C/text%3E%3C/svg%3E`
})

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const selectDevice = (device) => {
  selectedDevice.value = device
  isPlaying.value = false
  currentTime.value = 0
  ElMessage.success(`已选择设备：${device.name}`)
}

const togglePlay = () => {
  if (!selectedDevice.value) {
    ElMessage.warning('请先选择设备')
    return
  }
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startPlayback()
  } else {
    stopPlayback()
  }
}

const handlePlay = () => {
  togglePlay()
}

const startPlayback = () => {
  const speed = parseFloat(playSpeed.value)
  playTimer = setInterval(() => {
    currentTime.value += speed
    if (currentTime.value >= duration.value) {
      currentTime.value = 0
    }
  }, 1000)
}

const stopPlayback = () => {
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

const handleBackward = () => {
  currentTime.value = Math.max(0, currentTime.value - 300)
  ElMessage.info('快退5分钟')
}

const handleForward = () => {
  currentTime.value = Math.min(duration.value, currentTime.value + 300)
  ElMessage.info('快进5分钟')
}

const seekTo = (time) => {
  currentTime.value = time
  ElMessage.info(`跳转到 ${formatTime(time)}`)
}

const quickPlay = (type) => {
  const now = Date.now() / 1000
  switch (type) {
    case '30min':
      currentTime.value = duration.value - 1800
      break
    case '1hour':
      currentTime.value = duration.value - 3600
      break
    case '3hour':
      currentTime.value = duration.value - 10800
      break
    case 'today':
      currentTime.value = 0
      break
  }
  isPlaying.value = true
  startPlayback()
  ElMessage.success('开始回放')
}

const playAlarmVideo = (alarm) => {
  currentTime.value = 52200
  isPlaying.value = true
  startPlayback()
  ElMessage.success(`播放告警录像：${alarm.type}`)
}

const handleExport = () => {
  ElMessage.success('开始导出录像...')
}

const handleSnapshot = () => {
  ElMessage.success('已截图保存')
}

const handleFullscreen = () => {
  const player = document.querySelector('.video-player')
  if (player) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      player.requestFullscreen()
    }
  }
}

const startDrag = (e) => {
  // 简化实现
  ElMessage.info('拖动进度条')
}

onMounted(() => {
  selectedDevice.value = deviceList[0]
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.playback-layout {
  display: flex;
  gap: 16px;
  height: calc(100% - 60px);
}

.playback-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.video-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.video-player {
  position: relative;
  width: 100%;
  background: #000;
  aspect-ratio: 16/9;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  cursor: pointer;
  color: #fff;
  
  .play-icon {
    font-size: 64px;
  }
}

.video-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 20px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 14px;
}

.playback-controls {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  gap: 20px;
  background: $bg-darker;
}

.control-left,
.control-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-center {
  flex: 1;
}

.time-scale {
  width: 100%;
}

.scale-bar {
  position: relative;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  cursor: pointer;
}

.scale-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: $primary-color;
  border-radius: 4px;
}

.scale-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  
  &:active {
    cursor: grabbing;
  }
}

.video-segment {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 2px;
  
  &.normal {
    background: rgba(24, 144, 255, 0.3);
  }
  &.alarm {
    background: rgba(245, 34, 45, 0.5);
  }
  &.motion {
    background: rgba(250, 173, 20, 0.5);
  }
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: $text-muted;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .speed-label {
    font-size: 12px;
    color: $text-secondary;
  }
}

.timeline-card {
  flex: 1;
  min-height: 0;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    display: flex;
    flex-direction: column;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 14px;
    background: $primary-color;
    margin-right: 8px;
    border-radius: 2px;
    vertical-align: middle;
  }
}

.timeline-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.timeline-label {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

.legend {
  display: flex;
  gap: 15px;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $text-secondary;
    
    .dot {
      width: 12px;
      height: 8px;
      border-radius: 2px;
      
      &.normal { background: rgba(24, 144, 255, 0.5); }
      &.alarm { background: rgba(245, 34, 45, 0.7); }
      &.motion { background: rgba(250, 173, 20, 0.7); }
    }
  }
}

.timeline-track {
  position: relative;
  height: 40px;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  overflow: hidden;
}

.track-segment {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
  
  &.normal {
    background: rgba(24, 144, 255, 0.4);
  }
  &.alarm {
    background: rgba(245, 34, 45, 0.6);
  }
  &.motion {
    background: rgba(250, 173, 20, 0.6);
  }
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: $text-muted;
}

.playback-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  @include scrollbar;
}

.side-card {
  :deep(.el-card__body) {
    padding: 12px;
  }
}

.search-input {
  margin-bottom: 10px;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(24, 144, 255, 0.03);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(24, 144, 255, 0.08);
  }
  
  &.active {
    background: rgba(24, 144, 255, 0.15);
  }
}

.device-status {
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  
  &.online {
    background: $success-color;
    box-shadow: 0 0 4px $success-color;
  }
  &.offline {
    background: $error-color;
  }
  &.warning {
    background: $warning-color;
  }
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-size: 13px;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-org {
  font-size: 11px;
  color: $text-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.quick-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: $text-secondary;
  font-size: 12px;
  
  &:hover {
    background: rgba(24, 144, 255, 0.15);
    color: $primary-color;
  }
  
  .el-icon {
    font-size: 20px;
  }
}

.alarm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alarm-item {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(24, 144, 255, 0.08);
  }
  
  &.high {
    border-left: 3px solid $error-color;
    background: rgba(245, 34, 45, 0.05);
  }
  &.medium {
    border-left: 3px solid $warning-color;
    background: rgba(250, 173, 20, 0.05);
  }
  &.low {
    border-left: 3px solid $info-color;
    background: rgba(24, 144, 255, 0.05);
  }
}

.alarm-time {
  flex-shrink: 0;
  font-size: 12px;
  color: $text-muted;
  font-family: monospace;
}

.alarm-info {
  flex: 1;
  min-width: 0;
}

.alarm-type {
  font-size: 13px;
  color: $text-primary;
  font-weight: 500;
}

.alarm-desc {
  font-size: 11px;
  color: $text-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
</style>
