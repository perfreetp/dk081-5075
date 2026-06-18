<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">在线状态监测</div>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>刷新状态
        </el-button>
      </div>
    </div>
    
    <div class="status-cards">
      <el-card class="status-card total">
        <div class="card-icon">
          <el-icon :size="36"><VideoCamera /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ deviceList.length }}</div>
          <div class="card-label">设备总数</div>
        </div>
      </el-card>
      <el-card class="status-card online">
        <div class="card-icon">
          <el-icon :size="36"><CircleCheck /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ onlineCount }}</div>
          <div class="card-label">在线设备</div>
        </div>
        <div class="card-rate">在线率 {{ onlineRate }}%</div>
      </el-card>
      <el-card class="status-card offline">
        <div class="card-icon">
          <el-icon :size="36"><CircleClose /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ offlineCount }}</div>
          <div class="card-label">离线设备</div>
        </div>
      </el-card>
      <el-card class="status-card warning">
        <div class="card-icon">
          <el-icon :size="36"><Warning /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ warningCount }}</div>
          <div class="card-label">异常设备</div>
        </div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">各区域设备状态统计</span>
        </template>
        <div ref="barChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">设备类型分布</span>
        </template>
        <div ref="pieChartRef" class="chart-container"></div>
      </el-card>
    </div>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">异常设备列表</span>
          <el-radio-group v-model="statusFilter" size="small">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="offline">离线</el-radio-button>
            <el-radio-button value="warning">异常</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="abnormalList" stripe>
        <el-table-column prop="id" label="设备编号" width="100" />
        <el-table-column prop="name" label="设备名称" min-width="160" />
        <el-table-column prop="org" label="所属组织" min-width="160" />
        <el-table-column prop="type" label="设备类型" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'offline' ? 'danger' : 'warning'"
              size="small"
              effect="dark"
            >
              {{ row.status === 'offline' ? '离线' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="lastOnline" label="最后在线时间" width="180" />
        <el-table-column prop="duration" label="异常时长" width="120" align="center">
          <template #default="{ row }">
            <span :class="row.status === 'offline' ? 'text-danger' : 'text-warning'">
              {{ row.duration }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleCheck(row)">
              <el-icon><View /></el-icon>查看
            </el-button>
            <el-button type="warning" size="small" text @click="handleRestart(row)">
              <el-icon><RefreshRight /></el-icon>重启
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card class="timeline-card">
      <template #header>
        <span class="card-title">实时状态变更</span>
      </template>
      <div class="timeline-container">
        <el-timeline>
          <el-timeline-item
            v-for="item in statusLogs"
            :key="item.id"
            :timestamp="item.time"
            :type="item.type === 'online' ? 'success' : item.type === 'offline' ? 'danger' : 'warning'"
          >
            <el-card class="timeline-card-item">
              <div class="timeline-content">
                <span class="timeline-title">{{ deviceNameMap[item.deviceId] || item.deviceId }}</span>
                <span class="timeline-desc">
                  {{ item.type === 'online' ? '设备上线' : item.type === 'offline' ? '设备离线' : '设备异常' }}
                  - {{ item.description }}
                </span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { deviceList } from '@/mock/data'

const barChartRef = ref(null)
const pieChartRef = ref(null)
const statusFilter = ref('all')

let barChart = null
let pieChart = null

const onlineCount = computed(() => deviceList.filter(d => d.status === 'online').length)
const offlineCount = computed(() => deviceList.filter(d => d.status === 'offline').length)
const warningCount = computed(() => deviceList.filter(d => d.status === 'warning').length)
const onlineRate = computed(() => {
  if (deviceList.length === 0) return 0
  return ((onlineCount.value / deviceList.length) * 100).toFixed(1)
})

const abnormalList = computed(() => {
  const list = deviceList.filter(d => d.status !== 'online').map(d => ({
    ...d,
    lastOnline: '2024-01-15 12:30:00',
    duration: d.status === 'offline' ? '2小时15分' : '45分钟'
  }))
  
  if (statusFilter.value === 'all') return list
  return list.filter(d => d.status === statusFilter.value)
})

const deviceNameMap = computed(() => {
  const map = {}
  deviceList.forEach(d => {
    map[d.id] = d.name
  })
  return map
})

const statusLogs = reactive([
  { id: 1, deviceId: 'D004', type: 'offline', time: '2024-01-15 14:30:00', description: '网络连接中断' },
  { id: 2, deviceId: 'D006', type: 'warning', time: '2024-01-15 14:15:00', description: '码流异常，帧率下降' },
  { id: 3, deviceId: 'D011', type: 'offline', time: '2024-01-15 13:45:00', description: '设备断电' },
  { id: 4, deviceId: 'D002', type: 'online', time: '2024-01-15 13:30:00', description: '设备恢复正常' },
  { id: 5, deviceId: 'D008', type: 'online', time: '2024-01-15 12:00:00', description: '新设备接入' }
])

const initBarChart = () => {
  if (!barChartRef.value) return
  
  barChart = echarts.init(barChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['在线', '离线', '异常'],
      textStyle: { color: 'rgba(255,255,255,0.7)' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['市级', '东城区', '西城区', '南城区', '北城区', '重点单位'],
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
        name: '在线',
        type: 'bar',
        stack: 'total',
        data: [1, 3, 1, 1, 1, 4],
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '离线',
        type: 'bar',
        stack: 'total',
        data: [0, 1, 0, 0, 1, 0],
        itemStyle: { color: '#f5222d' }
      },
      {
        name: '异常',
        type: 'bar',
        stack: 'total',
        data: [0, 0, 1, 0, 0, 0],
        itemStyle: { color: '#faad14' }
      }
    ]
  }
  
  barChart.setOption(option)
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  
  pieChart = echarts.init(pieChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: 'rgba(255,255,255,0.7)' }
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#0b1e3f',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        data: [
          { value: 6, name: '球机', itemStyle: { color: '#1890ff' } },
          { value: 5, name: '枪机', itemStyle: { color: '#52c41a' } },
          { value: 4, name: '半球', itemStyle: { color: '#faad14' } }
        ]
      }
    ]
  }
  
  pieChart.setOption(option)
}

const handleRefresh = () => {
  ElMessage.success('状态已刷新')
}

const handleCheck = (row) => {
  ElMessage.info(`查看设备：${row.name}`)
}

const handleRestart = (row) => {
  ElMessage.success(`正在重启设备：${row.name}`)
}

const handleResize = () => {
  barChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initBarChart()
    initPieChart()
    window.addEventListener('resize', handleResize)
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.status-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.status-card {
  .el-card__body {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
  }
  
  &.total .card-icon {
    color: $primary-color;
    background: rgba(24, 144, 255, 0.1);
  }
  
  &.online .card-icon {
    color: $success-color;
    background: rgba(82, 196, 26, 0.1);
  }
  
  &.offline .card-icon {
    color: $error-color;
    background: rgba(245, 34, 45, 0.1);
  }
  
  &.warning .card-icon {
    color: $warning-color;
    background: rgba(250, 173, 20, 0.1);
  }
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: $text-primary;
  line-height: 1.2;
}

.card-label {
  font-size: 13px;
  color: $text-muted;
  margin-top: 4px;
}

.card-rate {
  font-size: 12px;
  color: $success-color;
  padding: 2px 8px;
  background: rgba(82, 196, 26, 0.1);
  border-radius: 10px;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  .el-card__body {
    height: 280px;
  }
}

.chart-container {
  width: 100%;
  height: 100%;
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

.table-card {
  margin-bottom: 16px;
}

.text-danger {
  color: $error-color;
}

.text-warning {
  color: $warning-color;
}

.timeline-card {
  .el-card__body {
    max-height: 300px;
    overflow-y: auto;
    @include scrollbar;
  }
}

.timeline-container {
  padding: 10px 0;
}

.timeline-card-item {
  border: none !important;
  background: rgba(24, 144, 255, 0.03) !important;
  
  .el-card__body {
    padding: 10px 15px;
    max-height: none;
  }
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.timeline-desc {
  font-size: 12px;
  color: $text-secondary;
}

:deep(.el-timeline-item__timestamp) {
  color: $text-muted !important;
  font-size: 12px;
}
</style>
