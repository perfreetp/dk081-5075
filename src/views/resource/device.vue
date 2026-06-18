<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">视频设备管理</div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>新增设备
        </el-button>
        <el-button @click="handleBatchSync">
          <el-icon><Refresh /></el-icon>批量同步
        </el-button>
      </div>
    </div>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="设备名称">
          <el-input v-model="filterForm.name" placeholder="请输入设备名称" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item label="所属组织">
          <el-select v-model="filterForm.org" placeholder="请选择" clearable style="width: 180px;">
            <el-option label="市级综治中心" value="市级" />
            <el-option label="东城区" value="东城" />
            <el-option label="西城区" value="西城" />
            <el-option label="南城区" value="南城" />
            <el-option label="北城区" value="北城" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="filterForm.status" placeholder="请选择" clearable style="width: 140px;">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="异常" value="warning" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="filterForm.type" placeholder="请选择" clearable style="width: 140px;">
            <el-option label="球机" value="球机" />
            <el-option label="枪机" value="枪机" />
            <el-option label="半球" value="半球" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <div class="table-header">
        <span>设备列表（共 {{ total }} 台）</span>
        <div class="status-summary">
          <span class="status-item online">
            <span class="dot"></span>在线 {{ onlineCount }}
          </span>
          <span class="status-item offline">
            <span class="dot"></span>离线 {{ offlineCount }}
          </span>
          <span class="status-item warning">
            <span class="dot"></span>异常 {{ warningCount }}
          </span>
        </div>
      </div>
      <el-table
        :data="tableData"
        stripe
        style="width: 100%"
        @row-dblclick="handleViewDetail"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="设备编号" width="100" />
        <el-table-column prop="name" label="设备名称" min-width="160" />
        <el-table-column prop="org" label="所属组织" min-width="160" />
        <el-table-column prop="type" label="设备类型" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'online' ? 'success' : row.status === 'offline' ? 'danger' : 'warning'"
              size="small"
              effect="dark"
            >
              <span class="status-dot" :class="row.status"></span>
              {{ row.status === 'online' ? '在线' : row.status === 'offline' ? '离线' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="resolution" label="分辨率" width="90" align="center" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handlePreview(row)">
              <el-icon><VideoPlay /></el-icon>预览
            </el-button>
            <el-button type="primary" size="small" text @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
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
    
    <el-dialog v-model="showAddDialog" :title="editingId ? '编辑设备' : '新增设备'" width="600px" @close="handleDialogClose">
      <el-form :model="deviceForm" :rules="formRules" ref="deviceFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编号" prop="id">
              <el-input v-model="deviceForm.id" placeholder="请输入设备编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属组织" prop="org">
              <el-select v-model="deviceForm.org" placeholder="请选择" style="width: 100%;">
                <el-option label="市级综治中心" value="市级综治中心" />
                <el-option label="东城区综治中心" value="东城区综治中心" />
                <el-option label="西城区综治中心" value="西城区综治中心" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="type">
              <el-select v-model="deviceForm.type" placeholder="请选择" style="width: 100%;">
                <el-option label="球机" value="球机" />
                <el-option label="枪机" value="枪机" />
                <el-option label="半球" value="半球" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP地址" prop="ip">
              <el-input v-model="deviceForm.ip" placeholder="请输入IP地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分辨率" prop="resolution">
              <el-select v-model="deviceForm.resolution" placeholder="请选择" style="width: 100%;">
                <el-option label="4K" value="4K" />
                <el-option label="1080P" value="1080P" />
                <el-option label="720P" value="720P" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="deviceForm.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="deviceForm.status" placeholder="请选择" style="width: 100%;">
                <el-option label="在线" value="online" />
                <el-option label="离线" value="offline" />
                <el-option label="异常" value="warning" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="经纬度">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-input v-model="deviceForm.lng" placeholder="经度" />
            </el-col>
            <el-col :span="12">
              <el-input v-model="deviceForm.lat" placeholder="纬度" />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPreviewDialog" title="视频预览" width="900px" class="preview-dialog">
      <div class="preview-container">
        <div class="preview-video">
          <img :src="previewThumb" alt="" />
          <div class="preview-info">
            <span class="preview-name">{{ currentDevice?.name }}</span>
            <el-tag type="success" size="small">
              <span class="status-dot online"></span>实时直播
            </el-tag>
          </div>
          <div class="preview-controls">
            <el-button-group>
              <el-button :icon="VideoPlay" circle />
              <el-button :icon="VideoPause" circle />
            </el-button-group>
            <el-button :icon="FullScreen" circle />
          </div>
        </div>
        <div class="preview-detail">
          <h4>设备信息</h4>
          <div class="detail-item">
            <span class="label">设备编号：</span>
            <span class="value">{{ currentDevice?.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">所属组织：</span>
            <span class="value">{{ currentDevice?.org }}</span>
          </div>
          <div class="detail-item">
            <span class="label">设备类型：</span>
            <span class="value">{{ currentDevice?.type }}</span>
          </div>
          <div class="detail-item">
            <span class="label">IP地址：</span>
            <span class="value">{{ currentDevice?.ip }}</span>
          </div>
          <div class="detail-item">
            <span class="label">分辨率：</span>
            <span class="value">{{ currentDevice?.resolution }}</span>
          </div>
          <div class="detail-item">
            <span class="label">品牌：</span>
            <span class="value">{{ currentDevice?.brand }}</span>
          </div>
          <el-divider />
          <div class="action-btns">
            <el-button type="primary" size="small" @click="handleAddToWall">
              <el-icon><Monitor /></el-icon>推送上墙
            </el-button>
            <el-button type="warning" size="small" @click="handlePlayback">
              <el-icon><Clock /></el-icon>历史回放
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, VideoPause, FullScreen } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores'

const store = useAppStore()
const router = useRouter()
const editingId = ref(null)

const filterForm = reactive({
  name: '',
  org: '',
  status: '',
  type: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const showAddDialog = ref(false)
const showPreviewDialog = ref(false)
const currentDevice = ref(null)
const deviceFormRef = ref(null)

const deviceForm = reactive({
  id: '',
  name: '',
  org: '',
  type: '',
  status: 'online',
  ip: '',
  resolution: '1080P',
  brand: '',
  lng: '',
  lat: ''
})

const formRules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  id: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  org: [{ required: true, message: '请选择所属组织', trigger: 'change' }],
  type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }]
}

const filteredData = computed(() => {
  return store.visibleDevices.filter(item => {
    if (filterForm.name && !item.name.includes(filterForm.name)) return false
    if (filterForm.org && !item.org.includes(filterForm.org)) return false
    if (filterForm.status && item.status !== filterForm.status) return false
    if (filterForm.type && item.type !== filterForm.type) return false
    return true
  })
})

const total = computed(() => filteredData.value.length)
const onlineCount = computed(() => store.visibleDevices.filter(d => d.status === 'online').length)
const offlineCount = computed(() => store.visibleDevices.filter(d => d.status === 'offline').length)
const warningCount = computed(() => store.visibleDevices.filter(d => d.status === 'warning').length)

const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const previewThumb = computed(() => {
  if (!currentDevice.value) return ''
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect fill='%230b1e3f' width='640' height='360'/%3E%3Ctext fill='white' font-size='20' font-family='Arial' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(currentDevice.value.name)} - 实时画面%3C/text%3E%3C/svg%3E`
})

const handleSearch = () => {
  pagination.page = 1
  ElMessage.success('查询成功')
}

const handleReset = () => {
  filterForm.name = ''
  filterForm.org = ''
  filterForm.status = ''
  filterForm.type = ''
  pagination.page = 1
}

const handleBatchSync = () => {
  ElMessage.success('批量同步中...')
}

const handlePreview = (row) => {
  currentDevice.value = row
  showPreviewDialog.value = true
}

const handleEdit = (row) => {
  editingId.value = row.id
  Object.assign(deviceForm, {
    id: row.id,
    name: row.name,
    org: row.org,
    type: row.type,
    status: row.status,
    ip: row.ip,
    resolution: row.resolution,
    brand: row.brand,
    lng: String(row.lng || ''),
    lat: String(row.lat || '')
  })
  showAddDialog.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除设备 "${row.name}" 吗？删除后列表和统计将同步更新。`, '提示', {
    type: 'warning'
  }).then(() => {
    const idx = store.devices.findIndex(d => d.id === row.id)
    if (idx > -1) {
      store.devices.splice(idx, 1)
      store.removeFromWall(row.id)
      ElMessage.success(`设备 "${row.name}" 删除成功，当前共 ${store.devices.length} 台`)
    }
  }).catch(() => {})
}

const handleViewDetail = (row) => {
  handlePreview(row)
}

const handleDialogClose = () => {
  deviceFormRef.value?.resetFields()
  editingId.value = null
  Object.assign(deviceForm, {
    id: '',
    name: '',
    org: '',
    type: '',
    status: 'online',
    ip: '',
    resolution: '1080P',
    brand: '',
    lng: '',
    lat: ''
  })
}

const handleSubmit = () => {
  deviceFormRef.value?.validate((valid) => {
    if (valid) {
      const latNum = parseFloat(deviceForm.lat)
      const lngNum = parseFloat(deviceForm.lng)
      if (editingId.value) {
        const index = store.devices.findIndex(d => d.id === editingId.value)
        if (index > -1) {
          store.devices[index] = {
            ...store.devices[index],
            ...deviceForm,
            lat: !isNaN(latNum) ? latNum : store.devices[index].lat,
            lng: !isNaN(lngNum) ? lngNum : store.devices[index].lng
          }
          ElMessage.success(`设备 "${deviceForm.name}" 修改成功`)
        }
      } else {
        const newDevice = {
          id: deviceForm.id,
          name: deviceForm.name,
          org: deviceForm.org,
          type: deviceForm.type,
          status: deviceForm.status,
          ip: deviceForm.ip,
          resolution: deviceForm.resolution,
          brand: deviceForm.brand,
          lat: !isNaN(latNum) ? latNum : (39.9042 + (Math.random() - 0.5) * 0.02),
          lng: !isNaN(lngNum) ? lngNum : (116.4074 + (Math.random() - 0.5) * 0.02)
        }
        store.devices.unshift(newDevice)
        ElMessage.success(`设备 "${deviceForm.name}" 新增成功，当前共 ${store.devices.length} 台`)
      }
      showAddDialog.value = false
      handleDialogClose()
    }
  })
}

const handleAddToWall = () => {
  if (!currentDevice.value) return
  store.addToWall(currentDevice.value)
  ElMessage.success(`已将 ${currentDevice.value.name} 推送到视频墙，共 ${store.wallDevices.length} 路`)
  router.push('/event/video-wall')
}

const handlePlayback = () => {
  if (!currentDevice.value) return
  store.setPlaybackDevice(currentDevice.value)
  showPreviewDialog.value = false
  router.push('/event/playback')
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.filter-card {
  margin-bottom: 16px;
  
  :deep(.el-card__body) {
    padding: 15px 20px;
  }
}

.filter-form {
  .el-form-item {
    margin-bottom: 0;
    margin-right: 0;
  }
}

.table-card {
  :deep(.el-card__body) {
    padding-top: 0;
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  border-bottom: 1px solid $border-color;
  margin-bottom: 10px;
}

.status-summary {
  display: flex;
  gap: 16px;
  font-size: 13px;
  font-weight: normal;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  &.online {
    color: $success-color;
    .dot { background: $success-color; box-shadow: 0 0 4px $success-color; }
  }
  &.offline {
    color: $error-color;
    .dot { background: $error-color; }
  }
  &.warning {
    color: $warning-color;
    .dot { background: $warning-color; }
  }
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
  
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.preview-dialog {
  :deep(.el-dialog__body) {
    padding-top: 0;
  }
}

.preview-container {
  display: flex;
  gap: 20px;
}

.preview-video {
  flex: 1;
  position: relative;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
  
  img {
    width: 100%;
    display: block;
  }
}

.preview-info {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  .preview-name {
    color: #fff;
    font-size: 14px;
  }
}

.preview-controls {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.preview-detail {
  width: 200px;
  
  h4 {
    margin: 0 0 15px 0;
    font-size: 15px;
    color: $text-primary;
  }
}

.detail-item {
  margin-bottom: 10px;
  font-size: 13px;
  
  .label {
    color: $text-muted;
  }
  .value {
    color: $text-secondary;
  }
}

.action-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  .el-button {
    width: 100%;
  }
}
</style>
