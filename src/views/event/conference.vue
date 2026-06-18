<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">跨部门会商</div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>创建会商
        </el-button>
      </div>
    </div>
    
    <div class="conference-layout">
      <div class="conference-main">
        <el-card class="video-card" v-if="currentConference">
          <div class="conference-video">
            <div class="main-video">
              <img :src="mainVideoThumb" alt="" />
              <div class="main-info">
                <span class="main-name">{{ currentConference.sponsor }} - 主持人</span>
                <el-tag type="success" size="small" effect="dark">
                  <span class="live-dot"></span>直播中
                </el-tag>
              </div>
            </div>
            <div class="participant-videos">
              <div 
                v-for="(p, index) in participants" 
                :key="p"
                class="participant-item"
                :class="{ active: activeParticipant === index }"
                @click="switchMainVideo(index)"
              >
                <img :src="getParticipantThumb(p, index)" alt="" />
                <span class="p-name">{{ p }}</span>
              </div>
            </div>
          </div>
          
          <div class="conference-controls">
            <div class="controls-left">
              <el-button circle :type="isMuted ? 'danger' : ''" @click="toggleMute">
                <el-icon v-if="!isMuted"><Microphone /></el-icon>
                <el-icon v-else><MicrophoneFilled /></el-icon>
              </el-button>
              <el-button circle :type="isCameraOff ? 'danger' : ''" @click="toggleCamera">
                <el-icon v-if="!isCameraOff"><VideoCamera /></el-icon>
                <el-icon v-else><VideoCameraFilled /></el-icon>
              </el-button>
              <el-button circle @click="handleShareScreen">
                <el-icon><Monitor /></el-icon>
              </el-button>
            </div>
            <div class="controls-center">
              <div class="conference-title">{{ currentConference.title }}</div>
              <div class="conference-time">{{ formatDuration(duration) }}</div>
            </div>
            <div class="controls-right">
              <el-button type="danger" @click="endConference">
                <el-icon><Close /></el-icon>结束会商
              </el-button>
              <el-button circle @click="handleFullscreen">
                <el-icon><FullScreen /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
        
        <el-card class="empty-card" v-else>
          <el-empty description="请选择或创建一个会商">
            <template #image>
              <el-icon :size="80" color="#1890ff"><ChatDotRound /></el-icon>
            </template>
            <el-button type="primary" @click="showCreateDialog = true">
              创建会商
            </el-button>
          </el-empty>
        </el-card>
        
        <el-card class="info-card">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="参会人员" name="participants">
              <div class="participant-list">
                <div 
                  v-for="(p, index) in participants" 
                  :key="p"
                  class="p-item"
                >
                  <el-avatar :size="36" class="p-avatar">
                    {{ p.charAt(0) }}
                  </el-avatar>
                  <div class="p-info">
                    <div class="p-name">{{ p }}</div>
                    <div class="p-role">{{ index === 0 ? '主持人' : '参会人' }}</div>
                  </div>
                  <div class="p-status">
                    <el-icon class="mic-icon"><Microphone /></el-icon>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="共享文件" name="files">
              <div class="file-list">
                <div v-for="file in sharedFiles" :key="file.id" class="file-item">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-meta">{{ file.uploader }} · {{ file.size }} · {{ file.time }}</div>
                  </div>
                  <el-button type="primary" size="small" text>下载</el-button>
                </div>
              </div>
              <el-upload class="file-upload" drag :auto-upload="false">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
              </el-upload>
            </el-tab-pane>
            
            <el-tab-pane label="会商记录" name="records">
              <div class="record-list">
                <div v-for="record in chatRecords" :key="record.id" class="record-item">
                  <el-avatar :size="32" class="r-avatar">
                    {{ record.user.charAt(0) }}
                  </el-avatar>
                  <div class="r-content">
                    <div class="r-header">
                      <span class="r-name">{{ record.user }}</span>
                      <span class="r-time">{{ record.time }}</span>
                    </div>
                    <div class="r-text">{{ record.content }}</div>
                  </div>
                </div>
              </div>
              <div class="chat-input">
                <el-input 
                  v-model="chatMessage" 
                  placeholder="输入消息..." 
                  @keyup.enter="sendMessage"
                >
                  <template #append>
                    <el-button @click="sendMessage">发送</el-button>
                  </template>
                </el-input>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
      
      <div class="conference-sidebar">
        <el-card class="side-card">
          <template #header>
            <span class="card-title">进行中的会商</span>
          </template>
          <div class="conference-list">
            <div 
              v-for="conf in ongoingConferences" 
              :key="conf.id"
              class="conf-item active"
              @click="selectConference(conf)"
            >
              <div class="conf-header">
                <span class="conf-title">{{ conf.title }}</span>
                <el-tag type="success" size="small" effect="dark">进行中</el-tag>
              </div>
              <div class="conf-meta">
                <span><el-icon><User /></el-icon> {{ conf.participants.length }}人参会</span>
                <span><el-icon><Clock /></el-icon> {{ conf.startTime }}</span>
              </div>
              <div class="conf-desc">{{ conf.description }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="side-card">
          <template #header>
            <span class="card-title">预约的会商</span>
          </template>
          <div class="conference-list">
            <div 
              v-for="conf in scheduledConferences" 
              :key="conf.id"
              class="conf-item"
              @click="viewConference(conf)"
            >
              <div class="conf-header">
                <span class="conf-title">{{ conf.title }}</span>
                <el-tag type="warning" size="small">已预约</el-tag>
              </div>
              <div class="conf-meta">
                <span><el-icon><User /></el-icon> {{ conf.participants.length }}人参会</span>
                <span><el-icon><Calendar /></el-icon> {{ conf.startTime }}</span>
              </div>
              <div class="conf-actions">
                <el-button type="primary" size="small" text @click.stop="joinConference(conf)">
                  加入
                </el-button>
                <el-button size="small" text @click.stop="editConference(conf)">
                  编辑
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
        
        <el-card class="side-card">
          <template #header>
            <span class="card-title">历史会商</span>
          </template>
          <div class="conference-list">
            <div 
              v-for="conf in endedConferences" 
              :key="conf.id"
              class="conf-item"
              @click="viewHistory(conf)"
            >
              <div class="conf-header">
                <span class="conf-title">{{ conf.title }}</span>
                <el-tag size="small">已结束</el-tag>
              </div>
              <div class="conf-meta">
                <span><el-icon><User /></el-icon> {{ conf.participants.length }}人参会</span>
                <span><el-icon><Clock /></el-icon> 2小时15分</span>
              </div>
              <div class="conf-actions">
                <el-button type="primary" size="small" text>
                  查看回放
                </el-button>
                <el-button size="small" text>
                  会议纪要
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <el-dialog v-model="showCreateDialog" title="创建会商" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="会商主题">
          <el-input v-model="createForm.title" placeholder="请输入会商主题" />
        </el-form-item>
        <el-form-item label="会商类型">
          <el-radio-group v-model="createForm.type">
            <el-radio label="immediate">立即开始</el-radio>
            <el-radio label="schedule">预约</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始时间" v-if="createForm.type === 'schedule'">
          <el-date-picker
            v-model="createForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="参会单位">
          <el-select 
            v-model="createForm.participants" 
            multiple 
            placeholder="请选择参会单位" 
            style="width: 100%;"
          >
            <el-option label="市级综治中心" value="市级综治中心" />
            <el-option label="东城区综治中心" value="东城区综治中心" />
            <el-option label="西城区综治中心" value="西城区综治中心" />
            <el-option label="南城区综治中心" value="南城区综治中心" />
            <el-option label="北城区综治中心" value="北城区综治中心" />
            <el-option label="市公安局" value="市公安局" />
            <el-option label="市消防支队" value="市消防支队" />
            <el-option label="市人民医院" value="市人民医院" />
            <el-option label="市交通局" value="市交通局" />
          </el-select>
        </el-form-item>
        <el-form-item label="会商描述">
          <el-input 
            v-model="createForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入会商描述" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { conferenceList } from '@/mock/data'

const activeTab = ref('participants')
const showCreateDialog = ref(false)
const currentConference = ref(null)
const isMuted = ref(false)
const isCameraOff = ref(false)
const activeParticipant = ref(0)
const duration = ref(0)
const chatMessage = ref('')
let timer = null

const createForm = reactive({
  title: '',
  type: 'immediate',
  startTime: '',
  participants: [],
  description: ''
})

const ongoingConferences = computed(() => 
  conferenceList.filter(c => c.status === 'ongoing')
)
const scheduledConferences = computed(() => 
  conferenceList.filter(c => c.status === 'scheduled')
)
const endedConferences = computed(() => 
  conferenceList.filter(c => c.status === 'ended')
)

const participants = computed(() => 
  currentConference.value?.participants || []
)

const mainVideoThumb = computed(() => {
  const name = participants.value[activeParticipant.value] || '会商'
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect fill='%23000' width='800' height='450'/%3E%3Ctext fill='%23fff' font-size='24' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(name)}%3C/text%3E%3C/svg%3E`
})

const getParticipantThumb = (name, index) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
  const color = colors[index % colors.length]
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Crect fill='${encodeURIComponent(color)}' opacity='0.6' width='200' height='120'/%3E%3Ctext fill='white' font-size='14' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(name)}%3C/text%3E%3C/svg%3E`
}

const sharedFiles = ref([
  { id: 1, name: '应急处置预案.pdf', size: '2.5MB', uploader: '张建国', time: '14:30' },
  { id: 2, name: '现场照片.zip', size: '15.8MB', uploader: '李明', time: '14:35' },
  { id: 3, name: '指挥调度方案.docx', size: '1.2MB', uploader: '王芳', time: '14:40' }
])

const chatRecords = ref([
  { id: 1, user: '张建国', time: '14:28', content: '大家好，南城体育馆火灾预警，请相关单位汇报情况' },
  { id: 2, user: '李明', time: '14:29', content: '东城区已派人员前往现场' },
  { id: 3, user: '周敏', time: '14:30', content: '消防支队已出动3辆消防车' },
  { id: 4, user: '刘强', time: '14:31', content: '公安局已部署周边交通管制' }
])

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const selectConference = (conf) => {
  currentConference.value = conf
  duration.value = 0
  startTimer()
}

const viewConference = (conf) => {
  ElMessage.info(`查看会商：${conf.title}`)
}

const viewHistory = (conf) => {
  ElMessage.info(`查看历史会商：${conf.title}`)
}

const joinConference = (conf) => {
  currentConference.value = conf
  ElMessage.success('已加入会商')
  startTimer()
}

const editConference = (conf) => {
  ElMessage.info(`编辑会商：${conf.title}`)
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  ElMessage.info(isMuted.value ? '已静音' : '已取消静音')
}

const toggleCamera = () => {
  isCameraOff.value = !isCameraOff.value
  ElMessage.info(isCameraOff.value ? '已关闭摄像头' : '已开启摄像头')
}

const handleShareScreen = () => {
  ElMessage.success('开始屏幕共享')
}

const handleFullscreen = () => {
  const video = document.querySelector('.conference-video')
  if (video) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }
}

const switchMainVideo = (index) => {
  activeParticipant.value = index
}

const endConference = () => {
  ElMessage.success('会商已结束')
  stopTimer()
  currentConference.value = null
}

const sendMessage = () => {
  if (!chatMessage.value.trim()) return
  chatRecords.value.push({
    id: chatRecords.value.length + 1,
    user: '张建国',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    content: chatMessage.value
  })
  chatMessage.value = ''
}

const handleCreate = () => {
  if (!createForm.title) {
    ElMessage.warning('请输入会商主题')
    return
  }
  if (createForm.participants.length === 0) {
    ElMessage.warning('请选择参会单位')
    return
  }
  ElMessage.success('会商创建成功')
  showCreateDialog.value = false
}

const startTimer = () => {
  stopTimer()
  timer = setInterval(() => {
    duration.value++
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  if (ongoingConferences.value.length > 0) {
    currentConference.value = ongoingConferences.value[0]
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.conference-layout {
  display: flex;
  gap: 16px;
  height: calc(100% - 60px);
}

.conference-main {
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

.conference-video {
  display: flex;
  gap: 12px;
  padding: 15px;
  background: #000;
}

.main-video {
  flex: 1;
  position: relative;
  aspect-ratio: 16/9;
  background: #111;
  border-radius: 6px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.main-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 13px;
}

.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  margin-right: 4px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.participant-videos {
  width: 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  @include scrollbar;
}

.participant-item {
  position: relative;
  aspect-ratio: 16/9;
  background: #111;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  &.active {
    border-color: $primary-color;
  }
  
  &:hover {
    border-color: rgba(24, 144, 255, 0.5);
  }
}

.p-name {
  position: absolute;
  bottom: 4px;
  left: 6px;
  color: #fff;
  font-size: 11px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.conference-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: $bg-darker;
  border-top: 1px solid $border-color;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.controls-center {
  text-align: center;
}

.conference-title {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
}

.conference-time {
  font-size: 12px;
  color: $text-muted;
  margin-top: 2px;
  font-family: monospace;
}

.empty-card {
  flex: 1;
  
  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.info-card {
  min-height: 280px;
  
  :deep(.el-card__body) {
    padding: 0;
  }
  
  :deep(.el-tabs__content) {
    padding: 15px 20px;
  }
}

.participant-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.p-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(24, 144, 255, 0.03);
}

.p-avatar {
  background: rgba(24, 144, 255, 0.2);
  color: $primary-color;
}

.p-info {
  flex: 1;
}

.p-name {
  font-size: 14px;
  color: $text-primary;
}

.p-role {
  font-size: 11px;
  color: $text-muted;
  margin-top: 2px;
}

.p-status {
  .mic-icon {
    color: $success-color;
    font-size: 16px;
  }
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(24, 144, 255, 0.03);
  border-radius: 4px;
}

.file-icon {
  font-size: 28px;
  color: $primary-color;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  color: $text-primary;
}

.file-meta {
  font-size: 11px;
  color: $text-muted;
  margin-top: 2px;
}

.file-upload {
  :deep(.el-upload-dragger) {
    background: rgba(24, 144, 255, 0.03);
    border: 1px dashed $border-color;
    
    &:hover {
      border-color: $primary-color;
    }
  }
}

.upload-icon {
  font-size: 48px;
  color: $primary-color;
  margin: 10px 0;
}

.record-list {
  max-height: 200px;
  overflow-y: auto;
  @include scrollbar;
  margin-bottom: 15px;
}

.record-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.r-avatar {
  flex-shrink: 0;
  background: rgba(24, 144, 255, 0.2);
  color: $primary-color;
  font-size: 12px;
}

.r-content {
  flex: 1;
  min-width: 0;
}

.r-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.r-name {
  font-size: 13px;
  color: $text-primary;
  font-weight: 500;
}

.r-time {
  font-size: 11px;
  color: $text-muted;
}

.r-text {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.5;
}

.chat-input {
  margin-top: 10px;
}

.conference-sidebar {
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

.conference-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.conf-item {
  padding: 10px 12px;
  background: rgba(24, 144, 255, 0.03);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  
  &:hover {
    background: rgba(24, 144, 255, 0.08);
  }
  
  &.active {
    border-left-color: $success-color;
    background: rgba(82, 196, 26, 0.08);
  }
}

.conf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.conf-title {
  font-size: 13px;
  color: $text-primary;
  font-weight: 500;
}

.conf-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: $text-muted;
  margin-bottom: 6px;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.conf-desc {
  font-size: 12px;
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conf-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid $border-color;
}
</style>
