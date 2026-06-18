<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">地图视图</div>
      <div class="header-actions">
        <el-radio-group v-model="mapType" size="small">
          <el-radio-button value="standard">标准地图</el-radio-button>
          <el-radio-button value="satellite">卫星地图</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="handleLocate">
          <el-icon><Location /></el-icon>定位
        </el-button>
        <el-button @click="handleFullScreen">
          <el-icon><FullScreen /></el-icon>全屏
        </el-button>
      </div>
    </div>

    <div class="map-layout">
      <div class="map-sidebar">
        <el-card class="side-card">
          <template #header>
            <span class="card-title">图层控制</span>
          </template>
          <div class="layer-list">
            <div class="layer-item" v-for="layer in layers" :key="layer.key">
              <el-checkbox v-model="layer.visible" @change="toggleLayer(layer)">
                <span class="layer-icon" :style="{ background: layer.color }"></span>
                {{ layer.name }}
              </el-checkbox>
              <span class="layer-count">{{ visibleDeviceCount[layer.key] }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="side-card">
          <template #header>
            <span class="card-title">组织筛选</span>
          </template>
          <el-input
            v-model="searchText"
            placeholder="搜索设备"
            size="small"
            clearable
            class="search-input"
            @clear="handleSearchClear"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-tree
            ref="treeRef"
            :data="filteredOrgData"
            :props="{ label: 'label', children: 'children' }"
            default-expand-all
            show-checkbox
            node-key="id"
            :default-checked-keys="selectedOrgIds"
            @check="handleOrgCheck"
            class="org-tree"
          />
          <el-button v-if="selectedOrgIds.length > 0" size="small" plain type="danger" style="margin-top: 8px; width: 100%;" @click="clearOrgFilter">
            <el-icon><CircleClose /></el-icon>清空组织筛选
          </el-button>
        </el-card>

        <el-card class="side-card device-list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">设备列表</span>
              <span class="count-badge">{{ filteredDevices.length }} 台</span>
            </div>
          </template>
          <div class="device-list">
            <div
              v-for="device in filteredDevices.slice(0, 20)"
              :key="device.id"
              class="device-item"
              :class="{ active: selectedDevice?.id === device.id }"
              @click="selectDevice(device)"
            >
              <div class="device-icon" :class="device.status">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="device-info">
                <div class="device-name">{{ device.name }}</div>
                <div class="device-org">{{ device.org }}</div>
              </div>
              <div class="device-status">
                <span class="status-dot" :class="device.status"></span>
              </div>
            </div>
            <el-empty v-if="filteredDevices.length === 0" description="暂无符合条件的设备" :image-size="60" />
          </div>
        </el-card>
      </div>

      <div class="map-main">
        <div ref="mapRef" id="mapView" class="map-container"></div>

        <div class="map-legend">
          <div class="legend-title">图例</div>
          <div class="legend-item">
            <span class="legend-dot online"></span>
            <span>在线设备</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot offline"></span>
            <span>离线设备</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot warning"></span>
            <span>异常设备</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot alarm"></span>
            <span>告警点</span>
          </div>
        </div>

        <div class="map-stats">
          <div class="stat-item">
            <span class="stat-label">设备总数</span>
            <span class="stat-value">{{ store.visibleDevices.length }}</span>
          </div>
          <div class="stat-item online">
            <span class="stat-label">在线</span>
            <span class="stat-value">{{ onlineCount }}</span>
          </div>
          <div class="stat-item offline">
            <span class="stat-label">离线</span>
            <span class="stat-value">{{ offlineCount }}</span>
          </div>
          <div class="stat-item warning">
            <span class="stat-label">异常</span>
            <span class="stat-value">{{ warningCount }}</span>
          </div>
        </div>
      </div>

      <div v-if="selectedDevice" class="device-detail-panel">
        <div class="panel-header">
          <span class="panel-title">设备详情</span>
          <el-icon class="close-btn" @click="selectedDevice = null"><Close /></el-icon>
        </div>
        <div class="panel-body">
          <div class="detail-video" @click="handlePreview">
            <img :src="getVideoThumb(selectedDevice)" alt="" />
            <div class="play-overlay">
              <el-icon><VideoPlay /></el-icon>
              <span>点击预览</span>
            </div>
          </div>

          <div class="detail-info">
            <h4>{{ selectedDevice.name }}</h4>
            <div class="info-list">
              <div class="info-row">
                <span class="label">设备编号</span>
                <span class="value">{{ selectedDevice.id }}</span>
              </div>
              <div class="info-row">
                <span class="label">所属组织</span>
                <span class="value">{{ selectedDevice.org }}</span>
              </div>
              <div class="info-row">
                <span class="label">设备类型</span>
                <span class="value">{{ selectedDevice.type }}</span>
              </div>
              <div class="info-row">
                <span class="label">设备状态</span>
                <span class="value">
                  <el-tag :type="selectedDevice.status === 'online' ? 'success' : selectedDevice.status === 'offline' ? 'danger' : 'warning'" size="small">
                    {{ selectedDevice.status === 'online' ? '在线' : selectedDevice.status === 'offline' ? '离线' : '异常' }}
                  </el-tag>
                </span>
              </div>
              <div class="info-row">
                <span class="label">IP地址</span>
                <span class="value">{{ selectedDevice.ip }}</span>
              </div>
              <div class="info-row">
                <span class="label">分辨率</span>
                <span class="value">{{ selectedDevice.resolution }}</span>
              </div>
              <div class="info-row">
                <span class="label">品牌</span>
                <span class="value">{{ selectedDevice.brand }}</span>
              </div>
            </div>
          </div>

          <div class="detail-actions">
            <el-button type="primary" style="flex: 1;" @click="handlePreview">
              <el-icon><VideoPlay /></el-icon>预览
            </el-button>
            <el-button type="success" style="flex: 1;" @click="handleAddToWall">
              <el-icon><Monitor /></el-icon>上墙
            </el-button>
            <el-button type="warning" style="flex: 1;" @click="handlePlayback">
              <el-icon><Clock /></el-icon>回放
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import L from 'leaflet'
import { orgData } from '@/mock/data'
import { useAppStore } from '@/stores'

const store = useAppStore()
const router = useRouter()

const mapType = ref('standard')
const searchText = ref('')
const selectedDevice = ref(null)
const treeRef = ref(null)
const mapRef = ref(null)
const selectedOrgIds = ref([])
let map = null
let markers = []
let tileLayer = null

const filteredOrgData = computed(() => orgData)

const layers = reactive([
  { key: 'all', name: '全部设备', color: '#1890ff', visible: true },
  { key: 'online', name: '在线设备', color: '#52c41a', visible: true },
  { key: 'offline', name: '离线设备', color: '#f5222d', visible: true },
  { key: 'warning', name: '异常设备', color: '#faad14', visible: true }
])

const onlineCount = computed(() => store.visibleDevices.filter(d => d.status === 'online').length)
const offlineCount = computed(() => store.visibleDevices.filter(d => d.status === 'offline').length)
const warningCount = computed(() => store.visibleDevices.filter(d => d.status === 'warning').length)

const getOrgLabels = (ids) => {
  if (ids.length === 0) return []
  const labels = []
  const traverse = (nodes) => {
    for (const node of nodes) {
      if (ids.includes(node.id)) {
        labels.push(node.label.replace('综治中心', ''))
      }
      if (node.children) traverse(node.children)
    }
  }
  traverse(orgData)
  return labels
}

const filteredDevices = computed(() => {
  let result = [...store.visibleDevices]

  if (selectedOrgIds.value.length > 0) {
    const orgLabels = getOrgLabels(selectedOrgIds.value)
    result = result.filter(d => orgLabels.some(label => d.org.includes(label)))
  }

  const kw = searchText.value.trim()
  if (kw) {
    result = result.filter(d =>
      d.name.includes(kw) || d.org.includes(kw) || d.id.includes(kw)
    )
  }

  const allVisible = layers.find(l => l.key === 'all')?.visible
  if (!allVisible) {
    const statuses = []
    if (layers.find(l => l.key === 'online')?.visible) statuses.push('online')
    if (layers.find(l => l.key === 'offline')?.visible) statuses.push('offline')
    if (layers.find(l => l.key === 'warning')?.visible) statuses.push('warning')
    result = statuses.length > 0 ? result.filter(d => statuses.includes(d.status)) : []
  }

  return result
})

const visibleDeviceCount = computed(() => ({
  all: store.visibleDevices.length,
  online: store.visibleDevices.filter(d => d.status === 'online').length,
  offline: store.visibleDevices.filter(d => d.status === 'offline').length,
  warning: store.visibleDevices.filter(d => d.status === 'warning').length
}))

const getVideoThumb = (item) => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect fill='%230b1e3f' width='320' height='180'/%3E%3Ctext fill='white' font-size='14' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E`
}

const initMap = () => {
  if (map) return
  if (!mapRef.value || !document.getElementById('mapView')) return

  map = L.map('mapView', {
    zoomControl: false,
    attributionControl: false
  }).setView([39.9100, 116.4050], 12)

  L.control.zoom({ position: 'bottomright' }).addTo(map)
  updateTileLayer()
  addDeviceMarkers()

  setTimeout(() => {
    map && map.invalidateSize()
  }, 150)
}

const destroyMap = () => {
  if (map) {
    markers.forEach(m => { try { map.removeLayer(m) } catch (e) {} })
    markers = []
    try {
      map.remove()
    } catch (e) {}
    map = null
    tileLayer = null
  }
}

const updateTileLayer = () => {
  if (!map) return

  if (tileLayer) {
    try { map.removeLayer(tileLayer) } catch (e) {}
    tileLayer = null
  }

  let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  if (mapType.value === 'satellite') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  }

  tileLayer = L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map)
}

const addDeviceMarkers = () => {
  if (!map) return

  markers.forEach(m => { try { map.removeLayer(m) } catch (e) {} })
  markers = []

  filteredDevices.value.forEach(device => {
    const iconColor = device.status === 'online' ? '#52c41a' : device.status === 'offline' ? '#f5222d' : '#faad14'
    const icon = L.divIcon({
      className: 'device-marker',
      html: `
        <div style="
          width: 20px; height: 20px;
          background: ${iconColor};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
        ">
          ${device.status === 'online' ? '●' : device.status === 'offline' ? '○' : '!'}
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })

    const marker = L.marker([device.lat, device.lng], { icon }).addTo(map)
    marker.bindPopup(`
      <div style="min-width: 160px; color: #333;">
        <strong>${device.name}</strong><br/>
        状态：${device.status === 'online' ? '<span style="color:#52c41a">在线</span>' : device.status === 'offline' ? '<span style="color:#f5222d">离线</span>' : '<span style="color:#faad14">异常</span>'}<br/>
        类型：${device.type}<br/>
        所属：${device.org}
      </div>
    `)
    marker.on('click', () => {
      selectDevice(device)
    })
    markers.push(marker)
  })
}

const toggleLayer = (layer) => {
  if (layer.key === 'all') {
    layers.forEach(l => { l.visible = layer.visible })
  } else {
    const allLayer = layers.find(l => l.key === 'all')
    if (allLayer) {
      const othersOn = layers.filter(l => l.key !== 'all' && l.key !== layer.key).some(l => l.visible)
      if (!layer.visible && othersOn) {
        allLayer.visible = false
      } else if (layer.visible && !othersOn) {
        allLayer.visible = true
      } else if (!layer.visible) {
        allLayer.visible = true
      } else {
        allLayer.visible = false
      }
    }
  }
  ElMessage.info(`${layer.name}：${layer.visible ? '显示' : '隐藏'}`)
}

const handleOrgCheck = (_, info) => {
  selectedOrgIds.value = info.checkedKeys.filter(k => typeof k === 'string')
  if (selectedOrgIds.value.length > 0) {
    ElMessage.info(`已筛选 ${selectedOrgIds.value.length} 个组织`)
  } else {
    ElMessage.info('已清除组织筛选')
  }
}

const clearOrgFilter = () => {
  selectedOrgIds.value = []
  nextTick(() => {
    treeRef.value?.setCheckedKeys([])
  })
  ElMessage.info('已清空组织筛选')
}

const handleSearchClear = () => {
  searchText.value = ''
}

const selectDevice = (device) => {
  selectedDevice.value = device
  if (map) {
    try {
      map.flyTo([device.lat, device.lng], 15, { duration: 0.5 })
    } catch (e) {}
  }
}

const handleMapFocus = () => {
  const target = store.mapFocusDevice
  if (!target) return
  store.setMapFocusDevice(null)

  const visible = store.visibleDevices.find(d => d.id === target.id)
  if (!visible) {
    ElMessage.warning(`关联设备 "${target.name}" 因当前数据权限不可见，无法在地图上定位`)
    return
  }

  selectedDevice.value = visible
  setTimeout(() => {
    if (map) {
      try {
        map.flyTo([visible.lat, visible.lng], 16, { duration: 0.6 })
      } catch (e) {}
    }
  }, 300)
  ElMessage.success(`已定位到关联设备：${visible.name}`)
}

const handleLocate = () => {
  if (map) {
    try {
      map.flyTo([39.9100, 116.4050], 12)
    } catch (e) {}
  }
  ElMessage.success('已定位到市中心')
}

const handleFullScreen = () => {
  const mapEl = document.getElementById('mapView')
  if (mapEl) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      mapEl.requestFullscreen().then(() => {
        setTimeout(() => map && map.invalidateSize(), 200)
      })
    }
  }
}

const handlePreview = () => {
  if (!selectedDevice.value) return
  store.setPreviewDevice(selectedDevice.value)
  ElMessage.success(`已打开 ${selectedDevice.value.name} 视频预览`)
}

const handleAddToWall = () => {
  if (!selectedDevice.value) return
  store.addToWall(selectedDevice.value)
  ElMessage.success(`已将 ${selectedDevice.value.name} 推送到视频墙，共 ${store.wallDevices.length} 路`)
}

const handlePlayback = () => {
  if (!selectedDevice.value) return
  store.setPlaybackDevice(selectedDevice.value)
  router.push('/event/playback')
}

watch(mapType, () => {
  updateTileLayer()
})

watch(filteredDevices, () => {
  nextTick(() => addDeviceMarkers())
}, { deep: true })

watch(() => store.visibleDevices, () => {
  nextTick(() => addDeviceMarkers())
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initMap()
    handleMapFocus()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  destroyMap()
})

const handleResize = () => {
  setTimeout(() => {
    map && map.invalidateSize()
  }, 100)
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.map-layout {
  display: flex;
  gap: 16px;
  height: calc(100% - 60px);
}

.map-sidebar {
  width: 280px;
  flex-shrink: 0;
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

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(24, 144, 255, 0.03);
  border-radius: 4px;

  :deep(.el-checkbox__label) {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $text-secondary;
  }
}

.layer-icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.layer-count {
  font-size: 12px;
  color: $text-muted;
}

.search-input {
  margin-bottom: 10px;
}

.org-tree {
  max-height: 180px;
  overflow-y: auto;
  @include scrollbar;
  background: transparent;
  color: $text-secondary;
}

.device-list-card {
  flex: 1;
  min-height: 0;

  :deep(.el-card__body) {
    height: calc(100% - 57px);
    overflow-y: auto;
    @include scrollbar;
    padding: 8px 12px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.count-badge {
  font-size: 12px;
  color: $primary-color;
  background: rgba(24, 144, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
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

.device-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.online {
    background: rgba(82, 196, 26, 0.15);
    color: $success-color;
  }
  &.offline {
    background: rgba(245, 34, 45, 0.15);
    color: $error-color;
  }
  &.warning {
    background: rgba(250, 173, 20, 0.15);
    color: $warning-color;
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
    box-shadow: 0 0 6px $success-color;
  }
  &.offline {
    background: $error-color;
  }
  &.warning {
    background: $warning-color;
  }
}

.map-main {
  flex: 1;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid $border-color;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.map-legend {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(11, 30, 63, 0.9);
  border: 1px solid $border-color;
  border-radius: 6px;
  padding: 12px 15px;
  z-index: 1000;
}

.legend-title {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.online { background: $success-color; }
  &.offline { background: $error-color; }
  &.warning { background: $warning-color; }
  &.alarm { background: #722ed1; }
}

.map-stats {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  background: rgba(11, 30, 63, 0.9);
  border: 1px solid $border-color;
  border-radius: 6px;
  padding: 10px 20px;
  z-index: 1000;
}

.stat-item {
  text-align: center;

  .stat-label {
    display: block;
    font-size: 12px;
    color: $text-muted;
    margin-bottom: 4px;
  }
  .stat-value {
    font-size: 18px;
    font-weight: bold;
    color: $text-primary;
  }

  &.online .stat-value { color: $success-color; }
  &.offline .stat-value { color: $error-color; }
  &.warning .stat-value { color: $warning-color; }
}

.device-detail-panel {
  width: 300px;
  flex-shrink: 0;
  background: $bg-darker;
  border: 1px solid $border-color;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid $border-color;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.close-btn {
  cursor: pointer;
  color: $text-muted;
  font-size: 18px;

  &:hover {
    color: $error-color;
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  @include scrollbar;
  padding: 15px;
}

.detail-video {
  position: relative;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
  cursor: pointer;

  img {
    width: 100%;
    display: block;
  }
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;

  .el-icon {
    font-size: 36px;
  }
}

.detail-info {
  h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: $text-primary;
    font-weight: 600;
  }
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  font-size: 13px;

  .label {
    width: 70px;
    color: $text-muted;
    flex-shrink: 0;
  }
  .value {
    flex: 1;
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid $border-color;
}
</style>
