<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">操作审计</div>
      <div class="header-actions">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>导出日志
        </el-button>
      </div>
    </div>
    
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ totalLogs }}</div>
          <div class="stat-label">操作总次数</div>
        </div>
        <div class="stat-icon">
          <el-icon :size="28"><Document /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card success">
        <div class="stat-content">
          <div class="stat-value">{{ successCount }}</div>
          <div class="stat-label">成功次数</div>
        </div>
        <div class="stat-icon">
          <el-icon :size="28"><CircleCheck /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card fail">
        <div class="stat-content">
          <div class="stat-value">{{ failCount }}</div>
          <div class="stat-label">失败次数</div>
        </div>
        <div class="stat-icon">
          <el-icon :size="28"><CircleClose /></el-icon>
        </div>
      </el-card>
      <el-card class="stat-card user">
        <div class="stat-content">
          <div class="stat-value">{{ activeUsers }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
        <div class="stat-icon">
          <el-icon :size="28"><User /></el-icon>
        </div>
      </el-card>
    </div>
    
    <el-card class="chart-card">
      <template #header>
        <span class="card-title">操作趋势</span>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">审计日志</span>
          <div class="filter-bar">
            <el-input
              v-model="searchText"
              placeholder="搜索用户/操作"
              size="small"
              clearable
              style="width: 180px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterAction" placeholder="操作类型" size="small" clearable style="width: 140px;">
              <el-option label="视频上墙" value="视频上墙" />
              <el-option label="告警分派" value="告警分派" />
              <el-option label="历史回放" value="历史回放" />
              <el-option label="用户登录" value="用户登录" />
              <el-option label="权限修改" value="权限修改" />
              <el-option label="跨部门会商" value="跨部门会商" />
            </el-select>
            <el-select v-model="filterResult" placeholder="操作结果" size="small" clearable style="width: 120px;">
              <el-option label="成功" value="成功" />
              <el-option label="失败" value="失败" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              size="small"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
        </div>
      </template>
      
      <el-table :data="tableData" stripe>
        <el-table-column prop="id" label="序号" width="70" align="center" />
        <el-table-column prop="user" label="操作用户" width="120" />
        <el-table-column prop="action" label="操作类型" width="130">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small" effect="dark">
              {{ row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作对象" min-width="200" />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="time" label="操作时间" width="170" />
        <el-table-column prop="result" label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.result === '成功' ? 'success' : 'danger'" size="small">
              {{ row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="viewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>
    
    <el-dialog v-model="showDetailDialog" title="操作详情" width="550px">
      <div v-if="currentLog" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <el-tag :type="currentLog.result === '成功' ? 'success' : 'danger'" size="small">
              {{ currentLog.result }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作用户">{{ currentLog.user }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ currentLog.action }}</el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ currentLog.time }}</el-descriptions-item>
          <el-descriptions-item label="IP地址" :span="2">{{ currentLog.ip }}</el-descriptions-item>
          <el-descriptions-item label="操作对象" :span="2">{{ currentLog.target }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider>操作详情</el-divider>
        
        <div class="detail-info">
          <div class="detail-row">
            <span class="label">浏览器：</span>
            <span class="value">Chrome 120.0</span>
          </div>
          <div class="detail-row">
            <span class="label">操作系统：</span>
            <span class="value">Windows 10</span>
          </div>
          <div class="detail-row">
            <span class="label">请求方式：</span>
            <span class="value">POST</span>
          </div>
          <div class="detail-row">
            <span class="label">请求接口：</span>
            <span class="value">/api/operation/execute</span>
          </div>
          <div class="detail-row">
            <span class="label">响应状态：</span>
            <span class="value success">200 OK</span>
          </div>
          <div class="detail-row">
            <span class="label">响应耗时：</span>
            <span class="value">125ms</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { auditLogList } from '@/mock/data'

const searchText = ref('')
const filterAction = ref('')
const filterResult = ref('')
const dateRange = ref([])
const showDetailDialog = ref(false)
const currentLog = ref(null)
const chartRef = ref(null)
let chartInstance = null

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const totalLogs = 1258
const successCount = 1236
const failCount = 22
const activeUsers = 28

const total = computed(() => auditLogList.length)

const filteredData = computed(() => {
  return auditLogList.filter(item => {
    if (searchText.value && !item.user.includes(searchText.value) && !item.action.includes(searchText.value)) {
      return false
    }
    if (filterAction.value && item.action !== filterAction.value) return false
    if (filterResult.value && item.result !== filterResult.value) return false
    return true
  })
})

const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const getActionType = (action) => {
  const map = {
    '视频上墙': 'primary',
    '告警分派': 'warning',
    '历史回放': 'success',
    '用户登录': 'info',
    '权限修改': 'danger',
    '跨部门会商': '',
    '系统配置': 'warning'
  }
  return map[action] || 'info'
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
    legend: {
      data: ['操作次数', '成功次数', '失败次数'],
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
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
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
        name: '操作次数',
        type: 'line',
        smooth: true,
        data: [45, 28, 156, 189, 245, 178, 92],
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0)' }
          ])
        }
      },
      {
        name: '成功次数',
        type: 'line',
        smooth: true,
        data: [43, 27, 152, 185, 240, 175, 90],
        lineStyle: { color: '#52c41a', width: 2 },
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '失败次数',
        type: 'line',
        smooth: true,
        data: [2, 1, 4, 4, 5, 3, 2],
        lineStyle: { color: '#f5222d', width: 2 },
        itemStyle: { color: '#f5222d' }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const viewDetail = (row) => {
  currentLog.value = row
  showDetailDialog.value = true
}

const handleExport = () => {
  ElMessage.success('日志导出中...')
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  nextTick(() => {
    initChart()
    window.addEventListener('resize', handleResize)
    
    dateRange.value = [
      new Date().toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ]
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  .el-card__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(24, 144, 255, 0.15);
    color: $primary-color;
  }
  
  &.success .stat-icon {
    background: rgba(82, 196, 26, 0.15);
    color: $success-color;
  }
  
  &.fail .stat-icon {
    background: rgba(245, 34, 45, 0.15);
    color: $error-color;
  }
  
  &.user .stat-icon {
    background: rgba(114, 46, 209, 0.15);
    color: #722ed1;
  }
}

.stat-content {
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: $text-primary;
  }
  .stat-label {
    font-size: 12px;
    color: $text-muted;
    margin-top: 4px;
  }
}

.chart-card {
  margin-bottom: 16px;
  
  :deep(.el-card__body) {
    height: 260px;
    padding: 10px 0;
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

.filter-bar {
  display: flex;
  gap: 10px;
}

.table-card {
  :deep(.el-card__body) {
    padding-top: 0;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-content {
  padding: 10px 0;
  
  :deep(.el-descriptions__label) {
    color: $text-muted;
    background: rgba(24, 144, 255, 0.03);
  }
  :deep(.el-descriptions__body) {
    color: $text-secondary;
  }
  :deep(.el-descriptions__cell) {
    border-color: $border-color;
  }
}

.detail-info {
  padding: 0 10px;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 13px;
  
  .label {
    width: 100px;
    color: $text-muted;
    flex-shrink: 0;
  }
  .value {
    color: $text-secondary;
    
    &.success {
      color: $success-color;
    }
  }
}
</style>
