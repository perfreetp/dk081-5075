<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">统计报表</div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <el-select v-model="reportType" size="small" style="width: 140px;">
          <el-option label="日报表" value="day" />
          <el-option label="周报表" value="week" />
          <el-option label="月报表" value="month" />
          <el-option label="年报表" value="year" />
        </el-select>
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>导出报表
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>
    
    <div class="stats-overview">
      <el-card class="stat-card">
        <div class="stat-icon total">
          <el-icon :size="28"><DataAnalysis /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalAlarms }}</div>
          <div class="stat-label">告警总数</div>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>12.5%</span>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon processed">
          <el-icon :size="28"><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ processedAlarms }}</div>
          <div class="stat-label">已处理</div>
        </div>
        <div class="stat-rate">{{ processRate }}%</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon avg">
          <el-icon :size="28"><Timer /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ avgResponseTime }}<i>分钟</i></div>
          <div class="stat-label">平均响应</div>
        </div>
        <div class="stat-trend down">
          <el-icon><Bottom /></el-icon>
          <span>8.3%</span>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon online">
          <el-icon :size="28"><VideoCamera /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ onlineRate }}<i>%</i></div>
          <div class="stat-label">设备在线率</div>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>2.1%</span>
        </div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">告警趋势</span>
        </template>
        <div ref="trendChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">告警类型分布</span>
        </template>
        <div ref="typeChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">各级别告警占比</span>
        </template>
        <div ref="levelChartRef" class="chart-container"></div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card large">
        <template #header>
          <span class="card-title">各区域告警统计</span>
        </template>
        <div ref="areaChartRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">处理时效分布</span>
        </template>
        <div ref="efficiencyChartRef" class="chart-container"></div>
      </el-card>
    </div>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">各单位处置统计</span>
          <el-radio-group v-model="sortBy" size="small">
            <el-radio-button value="total">按总数</el-radio-button>
            <el-radio-button value="rate">按处置率</el-radio-button>
            <el-radio-button value="time">按响应时间</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="unitStats" stripe>
        <el-table-column prop="unit" label="单位名称" min-width="160" />
        <el-table-column prop="total" label="告警总数" width="100" align="center" sortable />
        <el-table-column prop="processed" label="已处理" width="100" align="center" sortable />
        <el-table-column prop="pending" label="待处理" width="100" align="center" sortable />
        <el-table-column prop="rate" label="处置率" width="100" align="center" sortable>
          <template #default="{ row }">
            <div class="rate-cell">
              <el-progress 
                :percentage="row.rate" 
                :show-text="false" 
                :stroke-width="6"
                :color="row.rate >= 90 ? '#52c41a' : row.rate >= 70 ? '#faad14' : '#f5222d'"
              />
              <span>{{ row.rate }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="avgTime" label="平均响应(分钟)" width="130" align="center" sortable />
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ $index }">
            <el-tag v-if="$index < 3" :type="$index === 0 ? 'danger' : $index === 1 ? 'warning' : 'info'" effect="dark">
              {{ $index + 1 }}
            </el-tag>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const dateRange = ref(['2024-01-09', '2024-01-15'])
const reportType = ref('week')
const sortBy = ref('total')

const trendChartRef = ref(null)
const typeChartRef = ref(null)
const levelChartRef = ref(null)
const areaChartRef = ref(null)
const efficiencyChartRef = ref(null)

let trendChart = null
let typeChart = null
let levelChart = null
let areaChart = null
let efficiencyChart = null

const totalAlarms = 156
const processedAlarms = 142
const avgResponseTime = 8.5
const onlineRate = 92.3
const processRate = 91.0

const unitStats = [
  { unit: '市级综治中心', total: 45, processed: 43, pending: 2, rate: 95.6, avgTime: 6.2 },
  { unit: '东城区综治中心', total: 38, processed: 35, pending: 3, rate: 92.1, avgTime: 7.8 },
  { unit: '西城区综治中心', total: 32, processed: 29, pending: 3, rate: 90.6, avgTime: 8.5 },
  { unit: '南城区综治中心', total: 25, processed: 22, pending: 3, rate: 88.0, avgTime: 9.2 },
  { unit: '北城区综治中心', total: 28, processed: 24, pending: 4, rate: 85.7, avgTime: 10.5 },
  { unit: '市公安局', total: 52, processed: 50, pending: 2, rate: 96.2, avgTime: 5.8 },
  { unit: '市消防支队', total: 18, processed: 18, pending: 0, rate: 100, avgTime: 4.2 },
  { unit: '市交通局', total: 22, processed: 20, pending: 2, rate: 90.9, avgTime: 7.5 }
]

const initTrendChart = () => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['告警数量', '已处理'],
      textStyle: { color: 'rgba(255,255,255,0.7)' },
      top: 0
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
        data: [22, 18, 25, 20, 28, 24, 19],
        lineStyle: { color: '#f5222d', width: 2 },
        itemStyle: { color: '#f5222d' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 34, 45, 0.4)' },
            { offset: 1, color: 'rgba(245, 34, 45, 0)' }
          ])
        }
      },
      {
        name: '已处理',
        type: 'line',
        smooth: true,
        data: [20, 16, 23, 18, 25, 22, 18],
        lineStyle: { color: '#52c41a', width: 2 },
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.4)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0)' }
          ])
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

const initTypeChart = () => {
  if (!typeChartRef.value) return
  typeChart = echarts.init(typeChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#0b1e3f',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        labelLine: { show: false },
        data: [
          { value: 35, name: '入侵告警', itemStyle: { color: '#f5222d' } },
          { value: 28, name: '人员聚集', itemStyle: { color: '#faad14' } },
          { value: 22, name: '违停检测', itemStyle: { color: '#1890ff' } },
          { value: 18, name: '设备异常', itemStyle: { color: '#722ed1' } },
          { value: 15, name: '遗留物品', itemStyle: { color: '#13c2c2' } },
          { value: 20, name: '火灾预警', itemStyle: { color: '#ff4d4f' } },
          { value: 18, name: '其他', itemStyle: { color: '#8c8c8c' } }
        ]
      }
    ]
  }
  
  typeChart.setOption(option)
}

const initLevelChart = () => {
  if (!levelChartRef.value) return
  levelChart = echarts.init(levelChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0b1e3f',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'center',
          formatter: '{total|156}\n{label|告警总数}',
          rich: {
            total: {
              fontSize: 28,
              fontWeight: 'bold',
              color: '#fff',
              lineHeight: 40
            },
            label: {
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)'
            }
          }
        },
        labelLine: { show: false },
        data: [
          { value: 32, name: '高危', itemStyle: { color: '#f5222d' } },
          { value: 58, name: '中危', itemStyle: { color: '#faad14' } },
          { value: 66, name: '低危', itemStyle: { color: '#1890ff' } }
        ]
      }
    ]
  }
  
  levelChart.setOption(option)
}

const initAreaChart = () => {
  if (!areaChartRef.value) return
  areaChart = echarts.init(areaChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['高危', '中危', '低危'],
      textStyle: { color: 'rgba(255,255,255,0.7)' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['市级', '东城区', '西城区', '南城区', '北城区', '公安局', '消防', '交通局'],
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [
      {
        name: '高危',
        type: 'bar',
        stack: 'total',
        data: [8, 6, 5, 4, 5, 9, 3, 2],
        itemStyle: { color: '#f5222d' }
      },
      {
        name: '中危',
        type: 'bar',
        stack: 'total',
        data: [15, 12, 10, 8, 10, 20, 6, 7],
        itemStyle: { color: '#faad14' }
      },
      {
        name: '低危',
        type: 'bar',
        stack: 'total',
        data: [22, 20, 17, 13, 13, 23, 9, 13],
        itemStyle: { color: '#1890ff' }
      }
    ]
  }
  
  areaChart.setOption(option)
}

const initEfficiencyChart = () => {
  if (!efficiencyChartRef.value) return
  efficiencyChart = echarts.init(efficiencyChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(11, 30, 63, 0.9)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 30,
        splitNumber: 6,
        itemStyle: {
          color: '#52c41a'
        },
        progress: {
          show: true,
          width: 18
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [0.3, '#f5222d'],
              [0.6, '#faad14'],
              [1, '#52c41a']
            ]
          }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          distance: -25,
          color: 'rgba(255,255,255,0.6)',
          fontSize: 10
        },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 30,
          borderRadius: 8,
          offsetCenter: [0, '15%'],
          fontSize: 24,
          fontWeight: 'bold',
          formatter: '{value}分钟',
          color: '#fff'
        },
        data: [{ value: 8.5, name: '平均响应时间' }]
      }
    ]
  }
  
  efficiencyChart.setOption(option)
}

const handleExport = () => {
  ElMessage.success('报表导出中...')
}

const handleRefresh = () => {
  ElMessage.success('数据已刷新')
}

const handleResize = () => {
  trendChart?.resize()
  typeChart?.resize()
  levelChart?.resize()
  areaChart?.resize()
  efficiencyChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initTypeChart()
    initLevelChart()
    initAreaChart()
    initEfficiencyChart()
    window.addEventListener('resize', handleResize)
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  .el-card__body {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 18px 20px;
  }
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.total { background: rgba(24, 144, 255, 0.15); color: $primary-color; }
  &.processed { background: rgba(82, 196, 26, 0.15); color: $success-color; }
  &.avg { background: rgba(250, 173, 20, 0.15); color: $warning-color; }
  &.online { background: rgba(19, 194, 194, 0.15); color: #13c2c2; }
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: bold;
  color: $text-primary;
  line-height: 1.2;
  
  i {
    font-style: normal;
    font-size: 13px;
    font-weight: normal;
    color: $text-muted;
    margin-left: 2px;
  }
}

.stat-label {
  font-size: 12px;
  color: $text-muted;
  margin-top: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  
  &.up { color: $error-color; }
  &.down { color: $success-color; }
  
  .el-icon {
    font-size: 12px;
  }
}

.stat-rate {
  font-size: 18px;
  font-weight: bold;
  color: $success-color;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  
  .chart-card.large {
    grid-column: span 2;
  }
}

.chart-card {
  :deep(.el-card__body) {
    height: 280px;
    padding: 10px 0;
  }
  
  &.large :deep(.el-card__body) {
    height: 300px;
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
  margin-bottom: 20px;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  
  :deep(.el-progress) {
    width: 80px;
  }
}
</style>
