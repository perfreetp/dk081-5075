<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">值班交接</div>
      <div class="header-actions">
        <el-button type="primary" @click="showHandoverDialog = true">
          <el-icon><Switch /></el-icon>交接班
        </el-button>
      </div>
    </div>
    
    <div class="duty-layout">
      <el-card class="current-duty-card">
        <template #header>
          <span class="card-title">当前值班</span>
        </template>
        <div class="duty-info">
          <div class="duty-date">{{ currentDate }}</div>
          <div class="duty-shift">
            <el-tag :type="currentShift === '白班' ? 'warning' : 'primary'" size="large" effect="dark">
              {{ currentShift }}
            </el-tag>
          </div>
          
          <el-divider />
          
          <div class="duty-person">
            <el-avatar :size="64" class="duty-avatar">
              {{ currentDutyPerson?.name?.charAt(0) }}
            </el-avatar>
            <div class="person-info">
              <div class="person-name">{{ currentDutyPerson?.name }}</div>
              <div class="person-role">{{ currentDutyPerson?.role }}</div>
              <div class="person-org">{{ currentDutyPerson?.org }}</div>
            </div>
          </div>
          
          <div class="duty-time">
            <div class="time-item">
              <span class="label">接班时间</span>
              <span class="value">{{ today }} 08:00:00</span>
            </div>
            <div class="time-item">
              <span class="label">交班时间</span>
              <span class="value">{{ today }} 18:00:00</span>
            </div>
          </div>
          
          <div class="duty-actions">
            <el-button type="primary" style="flex: 1;" @click="handleSignIn">
              <el-icon><Calendar /></el-icon>签到
            </el-button>
            <el-button type="warning" style="flex: 1;" @click="showHandoverDialog = true">
              <el-icon><Switch /></el-icon>交班
            </el-button>
          </div>
        </div>
      </el-card>
      
      <div class="duty-content">
        <el-card class="handover-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">交接班记录</span>
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
          </template>
          
          <el-table :data="dutyRecords" stripe>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="shift" label="班次" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.shift === '白班' ? 'warning' : 'primary'" size="small" effect="dark">
                  {{ row.shift }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="值班时间" width="160">
              <template #default="{ row }">
                {{ row.startTime }} - {{ row.endTime }}
              </template>
            </el-table-column>
            <el-table-column prop="onDuty" label="接班人" width="100" align="center" />
            <el-table-column prop="offDuty" label="交班人" width="100" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '进行中' ? 'success' : 'info'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handoverContent" label="交接内容" min-width="250" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" text @click="viewDetail(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        
        <el-card class="duty-schedule-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">值班排班</span>
              <div class="schedule-nav">
                <el-button size="small" circle @click="prevWeek">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <span class="week-label">{{ currentWeekLabel }}</span>
                <el-button size="small" circle @click="nextWeek">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="schedule-table">
            <div class="schedule-header">
              <div class="schedule-cell header">班次</div>
              <div 
                v-for="day in weekDays" 
                :key="day.date"
                class="schedule-cell header"
                :class="{ today: day.isToday }"
              >
                <div class="day-label">{{ day.weekday }}</div>
                <div class="date-label">{{ day.date }}</div>
              </div>
            </div>
            <div class="schedule-body">
              <div class="schedule-row">
                <div class="schedule-cell shift">白班<br/><span class="time">08:00-18:00</span></div>
                <div 
                  v-for="day in weekDays" 
                  :key="'day-' + day.date"
                  class="schedule-cell"
                  :class="{ today: day.isToday }"
                >
                  <div class="duty-person-cell">
                    <el-avatar :size="24" class="mini-avatar">张</el-avatar>
                    <span>张建国</span>
                  </div>
                </div>
              </div>
              <div class="schedule-row">
                <div class="schedule-cell shift">夜班<br/><span class="time">18:00-08:00</span></div>
                <div 
                  v-for="day in weekDays" 
                  :key="'night-' + day.date"
                  class="schedule-cell"
                  :class="{ today: day.isToday }"
                >
                  <div class="duty-person-cell">
                    <el-avatar :size="24" class="mini-avatar">吴</el-avatar>
                    <span>吴涛</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <el-dialog v-model="showHandoverDialog" title="交接班" width="600px" class="handover-dialog">
      <el-steps :active="2" finish-status="success" size="small">
        <el-step title="接班确认" />
        <el-step title="事项交接" />
        <el-step title="完成" />
      </el-steps>
      
      <div class="handover-content">
        <el-form :model="handoverForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="交班人">
                <el-input value="张建国" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="接班人">
                <el-select v-model="handoverForm.receiver" placeholder="请选择接班人" style="width: 100%;">
                  <el-option label="吴涛" value="吴涛" />
                  <el-option label="李明" value="李明" />
                  <el-option label="王芳" value="王芳" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="交接时间">
            <el-date-picker
              v-model="handoverForm.time"
              type="datetime"
              placeholder="选择交接时间"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="待办事项">
            <el-input 
              v-model="handoverForm.pending" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入待办事项" 
            />
          </el-form-item>
          <el-form-item label="系统状态">
            <el-input 
              v-model="handoverForm.systemStatus" 
              type="textarea" 
              :rows="2" 
              placeholder="请输入系统运行状态" 
            />
          </el-form-item>
          <el-form-item label="注意事项">
            <el-input 
              v-model="handoverForm.notes" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入其他注意事项" 
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showHandoverDialog = false">取消</el-button>
        <el-button type="primary" @click="handleHandover">确认交接</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showDetailDialog" title="交接详情" width="600px">
      <div v-if="currentRecord" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="日期">{{ currentRecord.date }}</el-descriptions-item>
          <el-descriptions-item label="班次">{{ currentRecord.shift }}</el-descriptions-item>
          <el-descriptions-item label="值班时间">{{ currentRecord.startTime }} - {{ currentRecord.endTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentRecord.status }}</el-descriptions-item>
          <el-descriptions-item label="交班人">{{ currentRecord.offDuty }}</el-descriptions-item>
          <el-descriptions-item label="接班人">{{ currentRecord.onDuty }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider>交接内容</el-divider>
        
        <div class="handover-text">{{ currentRecord.handoverContent }}</div>
        
        <el-divider>待办事项</el-divider>
        
        <div class="todo-list">
          <div class="todo-item">
            <el-checkbox disabled />
            <span>跟进和平路商业街入侵告警后续处理</span>
          </div>
          <div class="todo-item">
            <el-checkbox disabled checked />
            <span>检查设备离线情况并反馈</span>
          </div>
          <div class="todo-item">
            <el-checkbox disabled checked />
            <span>完成今日值班日志</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dutyRecords, userList } from '@/mock/data'
import dayjs from 'dayjs'

const dateRange = ref([])
const showHandoverDialog = ref(false)
const showDetailDialog = ref(false)
const currentRecord = ref(null)
const weekOffset = ref(0)

const handoverForm = reactive({
  receiver: '',
  time: '',
  pending: '3条待处理告警需跟进',
  systemStatus: '系统运行正常，2台设备离线',
  notes: ''
})

const currentDate = computed(() => dayjs().format('YYYY年MM月DD日'))
const today = computed(() => dayjs().format('YYYY-MM-DD'))

const currentShift = computed(() => {
  const hour = dayjs().hour()
  return hour >= 8 && hour < 18 ? '白班' : '夜班'
})

const currentDutyPerson = computed(() => {
  const shift = currentShift.value
  if (shift === '白班') {
    return userList[0]
  } else {
    return userList[7]
  }
})

const weekDays = computed(() => {
  const startOfWeek = dayjs().add(weekOffset.value * 7, 'day').startOf('week').add(1, 'day')
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const day = startOfWeek.add(i, 'day')
    days.push({
      date: day.format('MM/DD'),
      weekday: weekdays[i],
      isToday: day.isSame(dayjs(), 'day')
    })
  }
  
  return days
})

const currentWeekLabel = computed(() => {
  const startOfWeek = dayjs().add(weekOffset.value * 7, 'day').startOf('week').add(1, 'day')
  const endOfWeek = startOfWeek.add(6, 'day')
  return `${startOfWeek.format('YYYY/MM/DD')} - ${endOfWeek.format('YYYY/MM/DD')}`
})

const prevWeek = () => {
  weekOffset.value--
}

const nextWeek = () => {
  weekOffset.value++
}

const handleSignIn = () => {
  ElMessage.success('签到成功')
}

const handleHandover = () => {
  if (!handoverForm.receiver) {
    ElMessage.warning('请选择接班人')
    return
  }
  ElMessage.success('交接成功')
  showHandoverDialog.value = false
}

const viewDetail = (row) => {
  currentRecord.value = row
  showDetailDialog.value = true
}

onMounted(() => {
  dateRange.value = [
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]
  handoverForm.time = new Date()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.duty-layout {
  display: flex;
  gap: 16px;
  height: calc(100% - 60px);
}

.current-duty-card {
  width: 280px;
  flex-shrink: 0;
  
  :deep(.el-card__body) {
    padding: 20px;
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

.duty-info {
  text-align: center;
}

.duty-date {
  font-size: 16px;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 8px;
}

.duty-shift {
  margin-bottom: 15px;
}

.duty-person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.duty-avatar {
  background: rgba(24, 144, 255, 0.2);
  color: $primary-color;
  font-size: 24px;
}

.person-info {
  text-align: center;
}

.person-name {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.person-role {
  font-size: 12px;
  color: $text-muted;
  margin-top: 4px;
}

.person-org {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 2px;
}

.duty-time {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 6px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  
  .label {
    color: $text-muted;
  }
  .value {
    color: $text-secondary;
  }
}

.duty-actions {
  display: flex;
  gap: 10px;
}

.duty-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.handover-card {
  flex: 1;
  min-height: 0;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-top: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.duty-schedule-card {
  :deep(.el-card__body) {
    padding: 15px 20px;
  }
}

.schedule-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .week-label {
    font-size: 13px;
    color: $text-secondary;
    min-width: 180px;
    text-align: center;
  }
}

.schedule-table {
  border: 1px solid $border-color;
  border-radius: 4px;
  overflow: hidden;
}

.schedule-header {
  display: flex;
  background: rgba(24, 144, 255, 0.1);
}

.schedule-body {
  display: flex;
  flex-direction: column;
}

.schedule-row {
  display: flex;
  border-top: 1px solid $border-color;
  
  &:first-child {
    border-top: none;
  }
}

.schedule-cell {
  flex: 1;
  padding: 10px;
  border-left: 1px solid $border-color;
  text-align: center;
  font-size: 13px;
  color: $text-secondary;
  
  &:first-child {
    border-left: none;
  }
  
  &.header {
    font-weight: 600;
    color: $text-primary;
    background: rgba(24, 144, 255, 0.05);
  }
  
  &.today {
    background: rgba(24, 144, 255, 0.1);
  }
  
  &.shift {
    flex: 0 0 140px;
    background: rgba(24, 144, 255, 0.05);
    font-weight: 500;
    
    .time {
      font-size: 11px;
      color: $text-muted;
      font-weight: normal;
    }
  }
}

.day-label {
  font-size: 13px;
  color: $text-primary;
  margin-bottom: 2px;
}

.date-label {
  font-size: 11px;
  color: $text-muted;
}

.duty-person-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: $text-secondary;
}

.mini-avatar {
  width: 24px;
  height: 24px;
  font-size: 12px;
  background: rgba(24, 144, 255, 0.2);
  color: $primary-color;
}

.handover-dialog {
  :deep(.el-dialog__body) {
    padding-top: 20px;
  }
}

.handover-content {
  margin-top: 25px;
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

.handover-text {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.8;
  padding: 0 10px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 10px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: $text-secondary;
}
</style>
