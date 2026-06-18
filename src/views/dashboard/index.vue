<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <div class="header-title">
        <h2>市级综治中心级联指挥总览</h2>
        <p>实时监控 · 分级指挥 · 跨域协同</p>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">在线设备</span>
          <span class="stat-value online">{{ onlineCount }}<i>台</i></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">待办告警</span>
          <span class="stat-value warning">{{ pendingAlarmCount }}<i>条</i></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">今日处置</span>
          <span class="stat-value success">{{ resolvedCount }}<i>起</i></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">在岗人员</span>
          <span class="stat-value info">{{ onDutyCount }}<i>人</i></span>
        </div>
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="content-left">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">资源分布地图</span>
              <div class="card-actions">
                <el-tag size="small" type="success">在线 {{ onlineCount }}</el-tag>
                <el-tag size="small" type="danger">离线 {{ offlineCount }}</el-tag>
                <el-tag size="small" type="warning">异常 {{ warningCount }}</el-tag>
              </div>
            </div>
          </template>
          <div id="dashboardMap" class="map-container"></div>
        </el-card>
        
        <el-card class="alarm-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时告警</span>
              <el-button type="primary" size="small" text @click="goToAlarm">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="alarm-list">
            <div 
              v-for="item in recentAlarms" 
              :key="item.id"
              class="alarm-item"
              :class="item.level"
              @click="handleAlarm(item)"
            >
              <div class="alarm-icon">
                <el-icon v-if="item.level === 'high'"><WarningFilled /></el-icon>
                <el-icon v-else-if="item.level === 'medium'"><InfoFilled /></el-icon>
                <el-icon v-else><BellFilled /></el-icon>
              </div>
              <div class="alarm-info">
                <div class="alarm-top">
                  <span class="alarm-type">{{ item.type }}</span>
                  <span class="alarm-time">{{ item.time }}</span>
                </div>
                <div class="alarm-desc">{{ item.description }}</div>
                <div class="alarm-location">
                  <el-icon><Location /></el-icon>
                  {{ item.location }}
                </div>
              </div>
              <div class="alarm-status">
                <el-tag 
                  :type="item.status === 'pending' ? 'danger' : item.status === 'processing' ? 'warning' : 'success'"
                  size="small"
                >
                  {{ item.status === 'pending' ? '待处理' : item.status === 'processing' ? '处理中' : '已完成' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <div class="content-right">
        <el-card class="org-card">
          <template #header>
            <span class="card-title">级联组织树</span>
          </template>
          <el-tree
            :data="orgData"
            :props="{ label: 'label', children: 'children' }"
            default-expand-all
            class="org-tree"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <span class="node-level" :class="data.level"></span>
                <span class="node-label">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-card>
        
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">告警趋势（近7天）</span>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
        
        <el-card class="video-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">重点视频预览</span>
              <el-button type="primary" size="small" text @click="goToVideoWall">
                视频上墙 <el-icon><FullScreen /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="video-grid">
            <div 
              v-for="item in featuredVideos" 
              :key="item.id"
              class="video-item"
              @click="playVideo(item)"
            >
              <div class="video-thumb">
                <img :src="getVideoThumb(item)" alt="" />
                <div class="video-overlay">
                  <el-icon class="play-icon"><VideoPlay /></el-icon>
                </div>
                <span class="video-status" :class="item.status">
                  <span class="status-dot" :class="item.status"></span>
                  {{ item.status === 'online' ? '在线' : item.status === 'offline' ? '离线' : '异常' }}
                </span>
              </div>
              <div class="video-name">{{ item.name }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import L from 'leaflet'
import { orgData } from '@/mock/data'
import { useAppStore } from '@/stores'

const store = useAppStore()
const router = useRouter()
const chartRef = ref(null)
let map = null
let chartInstance = null
let mapMarkers = []

const onlineCount = computed(() => store.visibleDevices.filter(d => d.status === 'online').length)
const offlineCount = computed(() => store.visibleDevices.filter(d => d.status === 'offline').length)
const warningCount = computed(() => store.visibleDevices.filter(d => d.status === 'warning').length)
const pendingAlarmCount = computed(() => store.pendingAlarmCount)
const resolvedCount = computed(() => store.alarms.filter(a => a.status === 'resolved').length)
const onDutyCount = computed(() => store.users.filter(u => u.status === 'on').length)

const recentAlarms = computed(() => store.alarms.slice(0, 5))
const featuredVideos = computed(() => store.visibleDevices.filter(d => d.status === 'online').slice(0, 4))

const getVideoThumb = (item) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d']
  const index = item.id.charCodeAt(1) % colors.length
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect fill='%230b1e3f' width='320' height='180'/%3E%3Crect fill='${encodeURIComponent(colors[index])}' opacity='0.2' width='320' height='180'/%3E%3Ctext fill='white' font-size='14' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E`
}

const initMap = () => {
  if (!map) {
    map = L.map('dashboardMap', {
      zoomControl: true,
      attributionControl: false
    }).setView([39.9100, 116.4050], 12)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map)
  }

  mapMarkers.forEach(m => {
    try { map.removeLayer(m) } catch (e) {}
  })
  mapMarkers = []
  
  store.visibleDevices.forEach(device => {
    const iconColor = device.status === 'online' ? '#52c41a' : device.status === 'offline' ? '#f5222d' : '#faad14'
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width: 12px; height: 12px; background: ${iconColor}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${iconColor};"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    })
    
    const marker = L.marker([device.lat, device.lng], { icon }).addTo(map)
    marker.bindPopup(`
      <div style="color: #333;">
        <strong>${device.name}</strong><br/>
        状态：${device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '异常'}<br/>
        类型：${device.type}<br/>
        所属：${device.org}
      </div>
    `)
    mapMarkers.push(marker)
  })
}

const destroyMap = () => {
  mapMarkers.forEach(m => {
    try { map?.removeLayer(m) } catch (e) {}
  })
  mapMarkers = []
  if (map) {
    try { map.remove() } catch (e) {}
    map = null
  }
}

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1/9', '1/10', '1/11', '1/12', '1/13', '1/14', '1/15'],
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [
      {
        name: '告警数量',
        type: 'line',
        smooth: true,
        data: [12, 19, 8, 15, 22, 18, 10],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0)' }
          ])
        },
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const handleAlarm = (item) => {
  router.push('/event/alarm')
}

const handleNodeClick = (data) => {
  console.log('Node clicked:', data)
}

const playVideo = (item) => {
  store.addToWall(item)
  router.push('/event/video-wall')
}

const goToAlarm = () => {
  router.push('/event/alarm')
}

const goToVideoWall = () => {
  router.push('/event/video-wall')
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
  if (map) {
    map.invalidateSize()
  }
}

watch(() => store.visibleDevices, () => {
  if (map) {
    nextTick(() => initMap())
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initMap()
    initChart()
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  destroyMap()
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.dashboard-page {
  padding: 16px;
  height: 100%;
  overflow: auto;
  @include scrollbar;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(24, 144, 255, 0.02));
  border: 1px solid $border-color;
  border-radius: 4px;
}

.header-title {
  h2 {
    margin: 0 0 4px 0;
    font-size: 20px;
    color: $text-primary;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 12px;
    color: $text-muted;
  }
}

.header-stats {
  display: flex;
  gap: 30px;
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
    font-size: 24px;
    font-weight: bold;
    
    i {
      font-style: normal;
      font-size: 12px;
      font-weight: normal;
      margin-left: 2px;
      color: $text-muted;
    }
    
    &.online { color: $success-color; }
    &.warning { color: $warning-color; }
    &.success { color: $success-color; }
    &.info { color: $primary-color; }
  }
}

.dashboard-content {
  display: flex;
  gap: 16px;
  height: calc(100% - 100px);
}

.content-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.content-right {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.map-card {
  flex: 1;
  min-height: 0;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    padding: 0;
  }
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.alarm-card {
  height: 280px;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    padding: 10px 0;
    overflow-y: auto;
    @include scrollbar;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .card-actions {
    display: flex;
    gap: 8px;
  }
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

.alarm-list {
  padding: 0 15px;
}

.alarm-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(24, 144, 255, 0.03);
  border-left: 3px solid $border-color;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(24, 144, 255, 0.08);
  }
  
  &.high {
    border-left-color: $error-color;
    .alarm-icon { color: $error-color; }
  }
  
  &.medium {
    border-left-color: $warning-color;
    .alarm-icon { color: $warning-color; }
  }
  
  &.low {
    border-left-color: $info-color;
    .alarm-icon { color: $info-color; }
  }
}

.alarm-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alarm-info {
  flex: 1;
  min-width: 0;
}

.alarm-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.alarm-type {
  font-weight: 600;
  color: $text-primary;
  font-size: 14px;
}

.alarm-time {
  font-size: 12px;
  color: $text-muted;
}

.alarm-desc {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-location {
  font-size: 12px;
  color: $text-muted;
  display: flex;
  align-items: center;
  gap: 4px;
}

.org-card {
  height: 260px;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    overflow-y: auto;
    @include scrollbar;
  }
}

.org-tree {
  background: transparent;
  color: $text-secondary;
  
  :deep(.el-tree-node__content:hover) {
    background: rgba(24, 144, 255, 0.1);
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-level {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  
  &.city { background: $primary-color; }
  &.district { background: $success-color; }
  &.street { background: $warning-color; }
  &.community { background: #9254de; }
  &.unit { background: #13c2c2; }
}

.chart-card {
  height: 240px;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    padding: 10px 0;
  }
}

.chart-container {
  width: 100%;
  height: 100%;
}

.video-card {
  flex: 1;
  min-height: 0;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    overflow-y: auto;
    @include scrollbar;
  }
}

.video-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.video-item {
  cursor: pointer;
  
  &:hover {
    .video-overlay {
      opacity: 1;
    }
  }
}

.video-thumb {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.play-icon {
  font-size: 32px;
  color: #fff;
}

.video-status {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
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

.video-name {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
