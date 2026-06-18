<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">告警分派</div>
      <div class="header-actions">
        <el-badge :value="pendingCount" class="pending-badge" type="danger">
          <el-button @click="filterStatus = 'pending'">
            待处理 <el-tag type="danger" size="small" effect="dark">{{ pendingCount }}</el-tag>
          </el-button>
        </el-badge>
        <el-button @click="handleBatchAssign">
          <el-icon><Share /></el-icon>批量分派
        </el-button>
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>导出
        </el-button>
      </div>
    </div>
    
    <div class="alarm-stats">
      <el-card class="stat-card high">
        <div class="stat-icon">
          <el-icon :size="28"><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ highCount }}</div>
          <div class="stat-label">高危告警</div>
        </div>
      </el-card>
      <el-card class="stat-card medium">
        <div class="stat-icon">
          <el-icon :size="28"><InfoFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ mediumCount }}</div>
          <div class="stat-label">中危告警</div>
        </div>
      </el-card>
      <el-card class="stat-card low">
        <div class="stat-icon">
          <el-icon :size="28"><BellFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ lowCount }}</div>
          <div class="stat-label">低危告警</div>
        </div>
      </el-card>
      <el-card class="stat-card pending">
        <div class="stat-icon">
          <el-icon :size="28"><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </el-card>
      <el-card class="stat-card processing">
        <div class="stat-icon">
          <el-icon :size="28"><Loading /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ processingCount }}</div>
          <div class="stat-label">处理中</div>
        </div>
      </el-card>
      <el-card class="stat-card resolved">
        <div class="stat-icon">
          <el-icon :size="28"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ resolvedCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-card>
    </div>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">告警列表</span>
          <div class="filter-bar">
            <el-input
              v-model="searchText"
              placeholder="搜索告警"
              size="small"
              clearable
              style="width: 200px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterLevel" placeholder="告警级别" size="small" clearable style="width: 120px;">
              <el-option label="高危" value="high" />
              <el-option label="中危" value="medium" />
              <el-option label="低危" value="low" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="处理状态" size="small" clearable style="width: 120px;">
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已完成" value="resolved" />
            </el-select>
          </div>
        </div>
      </template>
      
      <el-table
        :data="tableData"
        stripe
        @row-click="handleRowClick"
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="告警级别" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.level === 'high' ? 'danger' : row.level === 'medium' ? 'warning' : 'info'" size="small" effect="dark">
              {{ row.level === 'high' ? '高危' : row.level === 'medium' ? '中危' : '低危' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="告警类型" width="120" />
        <el-table-column prop="description" label="告警描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="device" label="设备名称" min-width="140" />
        <el-table-column prop="location" label="位置" min-width="160" />
        <el-table-column prop="time" label="告警时间" width="170" />
        <el-table-column prop="handler" label="处理人" width="100" align="center">
          <template #default="{ row }">
            {{ row.handler || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'pending' ? 'danger' : row.status === 'processing' ? 'warning' : 'success'"
              size="small"
            >
              {{ row.status === 'pending' ? '待处理' : row.status === 'processing' ? '处理中' : '已完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click.stop="handleView(row)">
              <el-icon><View /></el-icon>查看
            </el-button>
            <el-button type="success" size="small" text @click.stop="handleAssign(row)" v-if="row.status === 'pending'">
              <el-icon><User /></el-icon>分派
            </el-button>
            <el-button type="warning" size="small" text @click.stop="handleProcess(row)" v-if="row.status !== 'resolved'">
              <el-icon><Edit /></el-icon>处理
            </el-button>
            <el-button type="info" size="small" text @click.stop="handleVideo(row)">
              <el-icon><VideoPlay /></el-icon>视频
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>
    
    <el-dialog v-model="showDetailDialog" title="告警详情" width="700px" class="detail-dialog">
      <div v-if="currentAlarm" class="alarm-detail">
        <div class="detail-header">
          <el-tag :type="currentAlarm.level === 'high' ? 'danger' : currentAlarm.level === 'medium' ? 'warning' : 'info'" size="large" effect="dark">
            {{ currentAlarm.level === 'high' ? '高危' : currentAlarm.level === 'medium' ? '中危' : '低危' }}
          </el-tag>
          <span class="detail-title">{{ currentAlarm.type }}</span>
          <el-tag :type="currentAlarm.status === 'pending' ? 'danger' : currentAlarm.status === 'processing' ? 'warning' : 'success'">
            {{ currentAlarm.status === 'pending' ? '待处理' : currentAlarm.status === 'processing' ? '处理中' : '已完成' }}
          </el-tag>
        </div>
        
        <el-descriptions :column="2" border size="small" class="detail-desc">
          <el-descriptions-item label="告警编号">{{ currentAlarm.id }}</el-descriptions-item>
          <el-descriptions-item label="告警时间">{{ currentAlarm.time }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentAlarm.device }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ currentAlarm.location }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentAlarm.handler || '未分派' }}</el-descriptions-item>
          <el-descriptions-item label="告警描述">{{ currentAlarm.description }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-video">
          <h4>关联视频</h4>
          <div class="video-preview">
            <img :src="getVideoThumb()" alt="" />
            <div class="video-info">
              <span>{{ currentAlarm.device }}</span>
              <el-button type="primary" size="small" @click="handleViewVideo">
                <el-icon><VideoPlay /></el-icon>查看视频
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="detail-timeline">
          <h4>处理记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="record in processRecords"
              :key="record.id"
              :timestamp="record.time"
              :type="record.type"
            >
              <p class="timeline-content">
                <strong>{{ record.user }}</strong> - {{ record.action }}
              </p>
              <p v-if="record.comment" class="timeline-comment">{{ record.comment }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog v-model="showAssignDialog" title="告警分派" width="500px">
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="告警信息">
          <span class="form-text">{{ currentAlarm?.description }}</span>
        </el-form-item>
        <el-form-item label="指派给">
          <el-select v-model="assignForm.handler" placeholder="请选择处理人" style="width: 100%;">
            <el-option label="张建国（市级）" value="张建国" />
            <el-option label="李明（东城区）" value="李明" />
            <el-option label="王芳（西城区）" value="王芳" />
            <el-option label="陈静（南城区）" value="陈静" />
            <el-option label="赵伟（北城区）" value="赵伟" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="assignForm.priority">
            <el-radio label="high">高</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="3" placeholder="请输入处理要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定分派</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showProcessDialog" title="处理告警" width="500px">
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="处理状态">
          <el-radio-group v-model="processForm.status">
            <el-radio label="processing">处理中</el-radio>
            <el-radio label="resolved">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input v-model="processForm.result" type="textarea" :rows="4" placeholder="请输入处理结果描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProcessDialog = false">取消</el-button>
        <el-button type="primary" @click="handleProcessSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { alarmList, userList } from '@/mock/data'

const searchText = ref('')
const filterLevel = ref('')
const filterStatus = ref('')
const showDetailDialog = ref(false)
const showAssignDialog = ref(false)
const showProcessDialog = ref(false)
const currentAlarm = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const assignForm = reactive({
  handler: '',
  priority: 'medium',
  remark: ''
})

const processForm = reactive({
  status: 'processing',
  result: ''
})

const processRecords = [
  { id: 1, user: '系统', action: '产生告警', time: '2024-01-15 14:28:05', type: 'danger', comment: '烟雾浓度超过阈值' },
  { id: 2, user: '张建国', action: '分派告警给李明', time: '2024-01-15 14:29:00', type: 'warning', comment: '请尽快核实处理' },
  { id: 3, user: '李明', action: '开始处理', time: '2024-01-15 14:30:15', type: 'primary', comment: '已通知消防部门' }
]

const highCount = computed(() => alarmList.filter(a => a.level === 'high').length)
const mediumCount = computed(() => alarmList.filter(a => a.level === 'medium').length)
const lowCount = computed(() => alarmList.filter(a => a.level === 'low').length)
const pendingCount = computed(() => alarmList.filter(a => a.status === 'pending').length)
const processingCount = computed(() => alarmList.filter(a => a.status === 'processing').length)
const resolvedCount = computed(() => alarmList.filter(a => a.status === 'resolved').length)

const filteredData = computed(() => {
  return alarmList.filter(item => {
    if (searchText.value && !item.description.includes(searchText.value) && !item.device.includes(searchText.value)) {
      return false
    }
    if (filterLevel.value && item.level !== filterLevel.value) return false
    if (filterStatus.value && item.status !== filterStatus.value) return false
    return true
  })
})

const total = computed(() => filteredData.value.length)

const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const getVideoThumb = () => {
  const name = currentAlarm.value?.device || ''
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'%3E%3Crect fill='%230b1e3f' width='600' height='300'/%3E%3Ctext fill='white' font-size='16' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(name)} - 告警现场%3C/text%3E%3C/svg%3E`
}

const handleRowClick = (row) => {
  handleView(row)
}

const handleView = (row) => {
  currentAlarm.value = row
  showDetailDialog.value = true
}

const handleAssign = (row) => {
  currentAlarm.value = row
  assignForm.handler = ''
  assignForm.priority = row.level
  assignForm.remark = ''
  showAssignDialog.value = true
}

const handleProcess = (row) => {
  currentAlarm.value = row
  processForm.status = row.status === 'pending' ? 'processing' : 'resolved'
  processForm.result = ''
  showProcessDialog.value = true
}

const handleVideo = (row) => {
  ElMessage.info('跳转到视频页面')
}

const handleViewVideo = () => {
  ElMessage.info('查看关联视频')
}

const handleAssignSubmit = () => {
  if (!assignForm.handler) {
    ElMessage.warning('请选择处理人')
    return
  }
  if (currentAlarm.value) {
    currentAlarm.value.handler = assignForm.handler
    currentAlarm.value.status = 'processing'
  }
  ElMessage.success('分派成功')
  showAssignDialog.value = false
}

const handleProcessSubmit = () => {
  if (!processForm.result) {
    ElMessage.warning('请输入处理结果')
    return
  }
  if (currentAlarm.value) {
    currentAlarm.value.status = processForm.status
  }
  ElMessage.success('提交成功')
  showProcessDialog.value = false
}

const handleBatchAssign = () => {
  ElMessage.info('批量分派功能')
}

const handleExport = () => {
  ElMessage.success('导出成功')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.alarm-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  .el-card__body {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 16px;
  }
  
  &.high .stat-icon { color: $error-color; background: rgba(245, 34, 45, 0.1); }
  &.medium .stat-icon { color: $warning-color; background: rgba(250, 173, 20, 0.1); }
  &.low .stat-icon { color: $info-color; background: rgba(24, 144, 255, 0.1); }
  &.pending .stat-icon { color: #eb2f96; background: rgba(235, 47, 150, 0.1); }
  &.processing .stat-icon { color: #722ed1; background: rgba(114, 46, 209, 0.1); }
  &.resolved .stat-icon { color: $success-color; background: rgba(82, 196, 26, 0.1); }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: $text-primary;
    line-height: 1.2;
  }
  .stat-label {
    font-size: 12px;
    color: $text-muted;
    margin-top: 4px;
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

.filter-bar {
  display: flex;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-dialog {
  :deep(.el-dialog__body) {
    padding-top: 0;
  }
}

.alarm-detail {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid $border-color;
}

.detail-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
}

.detail-desc {
  margin-bottom: 20px;
  
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

.detail-video {
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: $text-primary;
  }
}

.video-preview {
  position: relative;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  
  img {
    width: 100%;
    display: block;
  }
}

.video-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 15px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: 13px;
}

.detail-timeline {
  h4 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: $text-primary;
  }
}

.timeline-content {
  margin: 0;
  font-size: 13px;
  color: $text-secondary;
}

.timeline-comment {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: $text-muted;
}

.pending-badge {
  :deep(.el-badge__content) {
    transform: translateX(100%) translateY(-50%);
  }
}

.form-text {
  color: $text-secondary;
}
</style>
