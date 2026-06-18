<template>
  <div class="video-wall-page">
    <div class="wall-header">
      <div class="header-left">
        <h2 class="page-title">视频上墙</h2>
        <div class="layout-selector">
          <span class="label">布局：</span>
          <el-radio-group v-model="layoutType" size="small">
            <el-radio-button value="1">1画面</el-radio-button>
            <el-radio-button value="4">4画面</el-radio-button>
            <el-radio-button value="9">9画面</el-radio-button>
            <el-radio-button value="16">16画面</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button @click="handleAllPlay">
            <el-icon><VideoPlay /></el-icon>全部播放
          </el-button>
          <el-button @click="handleAllStop">
            <el-icon><VideoPause /></el-icon>全部停止
          </el-button>
        </el-button-group>
        <el-button type="primary" @click="handleSaveLayout">
          <el-icon><Save /></el-icon>保存布局
        </el-button>
        <el-button @click="handleFullScreen">
          <el-icon><FullScreen /></el-icon>全屏
        </el-button>
      </div>
    </div>
    
    <div class="wall-content">
      <div class="video-grid" :class="`layout-${layoutType}`">
        <div 
          v-for="index in parseInt(layoutType)" 
          :key="index"
          class="video-cell"
          :class="{ active: activeCell === index, 'has-video': wallVideos[index - 1] }"
          @click="selectCell(index)"
        >
          <div v-if="wallVideos[index - 1]" class="video-content">
            <img :src="getVideoThumb(wallVideos[index - 1], index)" alt="" />
            <div class="video-overlay">
              <div class="video-title">
                <span class="status-dot" :class="wallVideos[index - 1].status"></span>
                {{ wallVideos[index - 1].name }}
              </div>
              <div class="video-time">{{ currentTime }}</div>
            </div>
            <div class="video-controls" v-if="activeCell === index">
              <el-button-group size="small">
                <el-button circle>
                  <el-icon><VideoPlay /></el-icon>
                </el-button>
                <el-button circle>
                  <el-icon><VideoPause /></el-icon>
                </el-button>
                <el-button circle @click.stop="handleFullscreenOne(wallVideos[index - 1])">
                  <el-icon><FullScreen /></el-icon>
                </el-button>
                <el-button circle type="danger" @click.stop="removeVideo(index)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </el-button-group>
            </div>
            <div class="ptz-controls" v-if="activeCell === index && wallVideos[index - 1].type === '球机'">
              <div class="ptz-pad">
                <el-button size="small" class="ptz-btn up">
                  <el-icon><ArrowUp /></el-icon>
                </el-button>
                <el-button size="small" class="ptz-btn left">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button size="small" class="ptz-btn center">
                  <el-icon><Aim /></el-icon>
                </el-button>
                <el-button size="small" class="ptz-btn right">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
                <el-button size="small" class="ptz-btn down">
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
              </div>
              <div class="ptz-zoom">
                <el-button size="small" class="zoom-in">
                  <el-icon><ZoomIn /></el-icon>
                </el-button>
                <el-button size="small" class="zoom-out">
                  <el-icon><ZoomOut /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-cell">
            <el-icon class="empty-icon"><VideoCamera /></el-icon>
            <span>第 {{ index }} 窗口</span>
            <span class="tip">点击左侧设备添加</span>
          </div>
          <span class="cell-index">{{ index }}</span>
        </div>
      </div>
    </div>
    
    <div class="wall-sidebar">
      <el-card class="side-card">
        <template #header>
          <span class="card-title">设备列表</span>
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
            draggable="true"
            @click="addDeviceToWall(device)"
            @dragstart="handleDragStart($event, device)"
          >
            <div class="device-status">
              <span class="status-dot" :class="device.status"></span>
            </div>
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-org">{{ device.org }}</div>
            </div>
            <el-button type="primary" size="small" text>
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>
      
      <el-card class="side-card">
        <template #header>
          <span class="card-title">快捷场景</span>
        </template>
        <div class="scene-list">
          <div 
            v-for="scene in scenes" 
            :key="scene.id"
            class="scene-item"
            @click="applyScene(scene)"
          >
            <div class="scene-icon">
              <el-icon><Grid /></el-icon>
            </div>
            <div class="scene-info">
              <div class="scene-name">{{ scene.name }}</div>
              <div class="scene-desc">{{ scene.desc }}</div>
            </div>
            <el-button type="primary" size="small" text>应用</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores'

const store = useAppStore()

const layoutType = ref('9')
const searchText = ref('')
const activeCell = ref(1)
const currentTime = ref('')
let timer = null

const wallVideos = computed(() => {
  const count = parseInt(layoutType.value)
  const devices = store.wallDevices.slice(0, count)
  return [...devices, ...Array(Math.max(0, count - devices.length)).fill(null)]
})

const scenes = [
  { id: 1, name: '城区全景', desc: '4个城区关键点位' },
  { id: 2, name: '交通要道', desc: '主要交通路口监控' },
  { id: 3, name: '重点单位', desc: '重点单位监控画面' },
  { id: 4, name: '告警联动', desc: '告警关联视频自动上墙' }
]

const filteredDevices = computed(() => {
  if (!searchText.value) return store.visibleDevices
  return store.visibleDevices.filter(d =>
    d.name.includes(searchText.value) || d.org.includes(searchText.value)
  )
})

const getVideoThumb = (device, index) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911']
  const color = colors[(index - 1) % colors.length]
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect fill='%23000' width='640' height='360'/%3E%3Crect fill='${encodeURIComponent(color)}' opacity='0.3' width='640' height='360'/%3E%3Ctext fill='white' font-size='16' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(device.name)}%3C/text%3E%3Ctext fill='white' font-size='12' font-family='Arial' x='50%25' y='60%25' text-anchor='middle' dy='.3em'%3E实时画面%3C/text%3E%3C/svg%3E`
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

const selectCell = (index) => {
  activeCell.value = index
}

const addDeviceToWall = (device) => {
  const exists = store.wallDevices.find(d => d.id === device.id)
  if (exists) {
    ElMessage.warning(`${device.name} 已在视频墙上`)
    return
  }
  const count = parseInt(layoutType.value)
  if (store.wallDevices.length >= count) {
    ElMessage.warning('所有窗口已满，请先移除部分视频')
    return
  }
  store.addToWall(device)
  ElMessage.success(`已将 ${device.name} 推上墙，当前共 ${store.wallDevices.length} 路`)
}

const removeVideo = (index) => {
  const device = wallVideos.value[index - 1]
  if (device) {
    store.removeFromWall(device.id)
    ElMessage.success(`已移除 ${device.name}`)
  }
}

const handleAllPlay = () => {
  ElMessage.success('全部播放')
}

const handleAllStop = () => {
  ElMessage.success('全部停止')
}

const handleSaveLayout = () => {
  ElMessage.success('布局已保存')
}

const handleFullScreen = () => {
  const grid = document.querySelector('.video-grid')
  if (grid) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      grid.requestFullscreen()
    }
  }
}

const handleFullscreenOne = (device) => {
  ElMessage.info(`全屏播放：${device.name}`)
}

const handleDragStart = (e, device) => {
  e.dataTransfer.setData('deviceId', device.id)
}

const applyScene = (scene) => {
  store.clearWall()
  const onlineDevices = store.visibleDevices.filter(d => d.status === 'online').slice(0, parseInt(layoutType.value))
  onlineDevices.forEach(d => store.addToWall(d))
  ElMessage.success(`已应用场景：${scene.name}，共加载 ${onlineDevices.length} 路视频`)
}

watch(layoutType, () => {
  activeCell.value = Math.min(activeCell.value, parseInt(layoutType.value))
})

onMounted(() => {
  if (store.wallDevices.length === 0) {
    const onlineDevices = store.visibleDevices.filter(d => d.status === 'online').slice(0, 6)
    onlineDevices.forEach(d => store.addToWall(d))
  }
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.video-wall-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: $bg-dark;
}

.wall-header {
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $bg-darker;
  border-bottom: 1px solid $border-color;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.page-title {
  font-size: 18px;
  color: $text-primary;
  margin: 0;
  font-weight: 600;
}

.layout-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .label {
    font-size: 14px;
    color: $text-secondary;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wall-content {
  flex: 1;
  padding: 12px;
  overflow: hidden;
  display: flex;
  gap: 12px;
}

.video-grid {
  flex: 1;
  display: grid;
  gap: 8px;
  background: #000;
  border-radius: 4px;
  padding: 8px;
  
  &.layout-1 {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }
  
  &.layout-4 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  &.layout-9 {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
  
  &.layout-16 {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
  }
}

.video-cell {
  position: relative;
  background: #0a0a0a;
  border: 2px solid transparent;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  
  &.active {
    border-color: $primary-color;
    box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
  }
  
  &.has-video:hover {
    border-color: rgba(24, 144, 255, 0.5);
  }
}

.cell-index {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  z-index: 10;
}

.video-content {
  width: 100%;
  height: 100%;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 40px;
  background: linear-gradient(rgba(0,0,0,0.7), transparent);
  color: #fff;
  font-size: 12px;
}

.video-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  
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

.video-time {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin-top: 2px;
}

.video-controls {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.ptz-controls {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 10;
}

.ptz-pad {
  position: relative;
  width: 90px;
  height: 90px;
  
  .ptz-btn {
    position: absolute;
    width: 28px;
    height: 28px;
    padding: 0;
    
    &.up { top: 0; left: 50%; transform: translateX(-50%); }
    &.down { bottom: 0; left: 50%; transform: translateX(-50%); }
    &.left { left: 0; top: 50%; transform: translateY(-50%); }
    &.right { right: 0; top: 50%; transform: translateY(-50%); }
    &.center { 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      background: rgba(24, 144, 255, 0.3);
    }
  }
}

.ptz-zoom {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .el-button {
    width: 28px;
    height: 28px;
    padding: 0;
  }
}

.empty-cell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #333;
  
  .empty-icon {
    font-size: 36px;
    color: #222;
  }
  
  span {
    color: #444;
    font-size: 13px;
    
    &.tip {
      font-size: 11px;
      color: #333;
    }
  }
}

.wall-sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-card {
  :deep(.el-card__body) {
    padding: 12px;
  }
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  
  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 12px;
    background: $primary-color;
    margin-right: 6px;
    border-radius: 2px;
    vertical-align: middle;
  }
}

.search-input {
  margin-bottom: 10px;
}

.device-list {
  max-height: 300px;
  overflow-y: auto;
  @include scrollbar;
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
}

.device-status {
  flex-shrink: 0;
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

.scene-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scene-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(24, 144, 255, 0.03);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(24, 144, 255, 0.08);
  }
}

.scene-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: rgba(24, 144, 255, 0.15);
  color: $primary-color;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.scene-info {
  flex: 1;
  min-width: 0;
}

.scene-name {
  font-size: 13px;
  color: $text-primary;
  font-weight: 500;
}

.scene-desc {
  font-size: 11px;
  color: $text-muted;
  margin-top: 2px;
}
</style>
