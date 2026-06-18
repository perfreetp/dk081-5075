<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">组织树视图</div>
      <div class="header-actions">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="tree">树形视图</el-radio-button>
          <el-radio-button value="list">列表视图</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="handleExpandAll">
          <el-icon><Expand /></el-icon>全部展开
        </el-button>
        <el-button @click="handleCollapseAll">
          <el-icon><Fold /></el-icon>全部收起
        </el-button>
      </div>
    </div>
    
    <div class="tree-container" v-if="viewMode === 'tree'">
      <el-card class="tree-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">组织架构树</span>
            <el-input
              v-model="filterText"
              placeholder="搜索组织"
              size="small"
              style="width: 220px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </template>
        <div class="tree-wrapper">
          <el-tree
            ref="treeRef"
            :data="filteredOrgData"
            :props="{ label: 'label', children: 'children' }"
            :filter-node-method="filterNode"
            node-key="id"
            :default-expanded-keys="defaultExpandedKeys"
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
            class="custom-tree"
          >
            <template #default="{ node, data }">
              <div class="tree-node-item">
                <div class="node-main">
                  <span class="node-icon" :class="data.level">
                    <el-icon v-if="data.level === 'city'"><OfficeBuilding /></el-icon>
                    <el-icon v-else-if="data.level === 'district'"><Building /></el-icon>
                    <el-icon v-else-if="data.level === 'street'"><House /></el-icon>
                    <el-icon v-else-if="data.level === 'community'"><HomeFilled /></el-icon>
                    <el-icon v-else><Aim /></el-icon>
                  </span>
                  <span class="node-name">{{ node.label }}</span>
                  <el-tag 
                    v-if="data.level" 
                    size="small" 
                    :type="getLevelTagType(data.level)"
                    effect="dark"
                    class="level-tag"
                  >
                    {{ getLevelText(data.level) }}
                  </el-tag>
                </div>
                <div class="node-stats">
                  <span class="stat">
                    <el-icon><VideoCamera /></el-icon>
                    {{ getDeviceCount(data) }}
                  </span>
                  <span class="stat online">
                    <el-icon><CircleCheck /></el-icon>
                    {{ getOnlineCount(data) }}
                  </span>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </el-card>
      
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">组织详情</span>
            <span v-if="currentNode" class="current-node">{{ currentNode.label }}</span>
          </div>
        </template>
        
        <div v-if="currentNode" class="detail-content">
          <div class="detail-section">
            <h4><el-icon><InfoFilled /></el-icon> 基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">组织编码</span>
                <span class="value">{{ currentNode.id }}</span>
              </div>
              <div class="detail-item">
                <span class="label">组织名称</span>
                <span class="value">{{ currentNode.label }}</span>
              </div>
              <div class="detail-item">
                <span class="label">组织级别</span>
                <span class="value">
                  <el-tag :type="getLevelTagType(currentNode.level)" size="small" effect="dark">
                    {{ getLevelText(currentNode.level) }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item">
                <span class="label">上级组织</span>
                <span class="value">{{ parentNode?.label || '无' }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4><el-icon><DataLine /></el-icon> 资源统计</h4>
            <div class="stats-cards">
              <div class="stat-card total">
                <div class="stat-num">{{ getDeviceCount(currentNode) }}</div>
                <div class="stat-label">设备总数</div>
              </div>
              <div class="stat-card online">
                <div class="stat-num">{{ getOnlineCount(currentNode) }}</div>
                <div class="stat-label">在线设备</div>
              </div>
              <div class="stat-card offline">
                <div class="stat-num">{{ getDeviceCount(currentNode) - getOnlineCount(currentNode) }}</div>
                <div class="stat-label">离线/异常</div>
              </div>
              <div class="stat-card rate">
                <div class="stat-num">{{ getOnlineRate(currentNode) }}%</div>
                <div class="stat-label">在线率</div>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4><el-icon><VideoCamera /></el-icon> 下属设备</h4>
            <el-table :data="nodeDevices" size="small" max-height="200" stripe>
              <el-table-column prop="name" label="设备名称" min-width="140" />
              <el-table-column prop="type" label="类型" width="70" align="center" />
              <el-table-column prop="status" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <span class="status-dot" :class="row.status"></span>
                  {{ row.status === 'online' ? '在线' : row.status === 'offline' ? '离线' : '异常' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }">
                  <el-button type="primary" size="small" text @click="handleViewDevice(row)">
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div class="detail-section">
            <h4><el-icon><Setting /></el-icon> 快捷操作</h4>
            <div class="action-btns">
              <el-button type="primary" @click="handlePreview(currentNode)">
                <el-icon><VideoPlay /></el-icon>视频预览
              </el-button>
              <el-button type="success" @click="handleAddToWall(currentNode)">
                <el-icon><Monitor /></el-icon>一键上墙
              </el-button>
              <el-button type="warning" @click="handlePlayback(currentNode)">
                <el-icon><Clock /></el-icon>历史回放
              </el-button>
              <el-button type="info">
                <el-icon><ChatDotRound /></el-icon>发起会商
              </el-button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <el-icon :size="64" color="#1890ff"><Menu /></el-icon>
          <p>请从左侧选择组织节点</p>
        </div>
      </el-card>
    </div>
    
    <el-card v-else class="list-card">
      <el-table :data="flatOrgList" stripe row-key="id">
        <el-table-column prop="name" label="组织名称" min-width="200">
          <template #default="{ row }">
            <span style="padding-left: 20px;">
              <span class="node-level-dot" :class="row.level"></span>
              {{ row.label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getLevelTagType(row.level)" effect="dark">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备总数" width="100" align="center">
          <template #default="{ row }">{{ getDeviceCount(row) }}</template>
        </el-table-column>
        <el-table-column label="在线设备" width="100" align="center">
          <template #default="{ row }">
            <span class="text-success">{{ getOnlineCount(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="在线率" width="100" align="center">
          <template #default="{ row }">{{ getOnlineRate(row) }}%</template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handlePreview(row)">
              <el-icon><VideoPlay /></el-icon>预览
            </el-button>
            <el-button type="success" size="small" text @click="handleAddToWall(row)">
              <el-icon><Monitor /></el-icon>上墙
            </el-button>
            <el-button type="warning" size="small" text @click="handlePlayback(row)">
              <el-icon><Clock /></el-icon>回放
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orgData } from '@/mock/data'
import { useAppStore } from '@/stores'

const store = useAppStore()
const router = useRouter()

const viewMode = ref('tree')
const filterText = ref('')
const treeRef = ref(null)
const currentNode = ref(null)
const parentNode = ref(null)

const filterNode = (value, data) => {
  if (!value) return true
  return data.label.includes(value)
}

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

const filteredOrgData = computed(() => {
  const orgs = store.currentUserPerms.orgs
  if (!orgs || orgs.length === 0) return orgData

  const filterTree = (nodes) => {
    const result = []
    for (const node of nodes) {
      if (orgs.includes(node.id)) {
        result.push(node)
        continue
      }
      if (node.children) {
        const filteredChildren = filterTree(node.children)
        if (filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren })
        }
      }
    }
    return result
  }
  return filterTree(orgData)
})

const defaultExpandedKeys = computed(() => {
  const orgs = store.currentUserPerms.orgs
  if (!orgs || orgs.length === 0) return ['1', '2']
  const keys = new Set()
  const collectParents = (nodes, targetId, path = []) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.forEach(id => keys.add(id))
        return true
      }
      if (node.children) {
        if (collectParents(node.children, targetId, [...path, node.id])) {
          return true
        }
      }
    }
    return false
  }
  orgs.forEach(id => collectParents(orgData, id))
  orgs.forEach(id => keys.add(id))
  return Array.from(keys)
})

const flatOrgList = computed(() => {
  const result = []
  const flatten = (nodes) => {
    nodes.forEach(node => {
      result.push(node)
      if (node.children) flatten(node.children)
    })
  }
  flatten(filteredOrgData.value)
  return result
})

const getDeviceCount = (node) => {
  const name = node.label.replace('综治中心', '')
  return store.visibleDevices.filter(d => d.org.includes(name)).length
}

const getOnlineCount = (node) => {
  const name = node.label.replace('综治中心', '')
  return store.visibleDevices.filter(d => d.org.includes(name) && d.status === 'online').length
}

const getOnlineRate = (node) => {
  const total = getDeviceCount(node)
  if (total === 0) return 0
  return ((getOnlineCount(node) / total) * 100).toFixed(0)
}

const getLevelText = (level) => {
  const map = { city: '市级', district: '区级', street: '街道', community: '社区', unit: '单位' }
  return map[level] || level
}

const getLevelTagType = (level) => {
  const map = { city: 'primary', district: 'success', street: 'warning', community: '', unit: 'info' }
  return map[level] || ''
}

const nodeDevices = computed(() => {
  if (!currentNode.value) return []
  const name = currentNode.value.label.replace('综治中心', '')
  return store.visibleDevices.filter(d => d.org.includes(name)).slice(0, 5)
})

const getOrgFirstDevice = (node) => {
  const name = node.label.replace('综治中心', '')
  return store.visibleDevices.find(d => d.org.includes(name) && d.status === 'online')
    || store.visibleDevices.find(d => d.org.includes(name))
}

const findParent = (nodes, targetId, parent = null) => {
  for (const node of nodes) {
    if (node.id === targetId) return parent
    if (node.children) {
      const result = findParent(node.children, targetId, node)
      if (result !== null && result !== undefined) return result
    }
  }
  return null
}

const handleNodeClick = (data) => {
  currentNode.value = data
  parentNode.value = findParent(filteredOrgData.value, data.id)
}

const handleExpandAll = () => {
  const expandAll = (nodes) => {
    nodes.forEach(node => {
      treeRef.value?.store?.nodesMap?.get(node.id)?.setExpanded(true)
      if (node.children) expandAll(node.children)
    })
  }
  expandAll(filteredOrgData.value)
}

const handleCollapseAll = () => {
  const collapseAll = (nodes) => {
    nodes.forEach(node => {
      treeRef.value?.store?.nodesMap?.get(node.id)?.setExpanded(false)
      if (node.children) collapseAll(node.children)
    })
  }
  collapseAll(filteredOrgData.value)
}

const handleViewDevice = (row) => {
  store.setPreviewDevice(row)
  ElMessage.success(`已打开设备：${row.name} 预览`)
}

const handlePreview = (row) => {
  const device = getOrgFirstDevice(row)
  if (device) {
    store.setPreviewDevice(device)
    ElMessage.success(`已打开 ${row.label} 视频预览：${device.name}`)
  } else {
    ElMessage.warning(`${row.label} 暂无可预览的设备`)
  }
}

const handleAddToWall = (row) => {
  const name = row.label.replace('综治中心', '')
  const devices = store.visibleDevices.filter(d => d.org.includes(name) && d.status === 'online').slice(0, 4)
  if (devices.length === 0) {
    ElMessage.warning(`${row.label} 暂无可上墙的在线设备`)
    return
  }
  devices.forEach(d => store.addToWall(d))
  ElMessage.success(`已将 ${row.label} 的 ${devices.length} 路视频推送到视频墙，共 ${store.wallDevices.length} 路`)
}

const handlePlayback = (row) => {
  const device = getOrgFirstDevice(row)
  if (device) {
    store.setPlaybackDevice(device)
    router.push('/event/playback')
  } else {
    ElMessage.warning(`${row.label} 暂无可回放的设备`)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.tree-container {
  display: flex;
  gap: 16px;
  height: calc(100% - 60px);
}

.tree-card {
  width: 400px;
  flex-shrink: 0;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    padding: 15px;
    overflow: hidden;
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

.current-node {
  font-size: 13px;
  color: $primary-color;
}

.tree-wrapper {
  height: 100%;
  overflow-y: auto;
  @include scrollbar;
}

.custom-tree {
  background: transparent;
  
  :deep(.el-tree-node__content) {
    height: 44px;
    &:hover {
      background: rgba(24, 144, 255, 0.08);
    }
  }
  
  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: rgba(24, 144, 255, 0.15);
  }
}

.tree-node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding-right: 10px;
}

.node-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  
  &.city { background: rgba(24, 144, 255, 0.2); color: $primary-color; }
  &.district { background: rgba(82, 196, 26, 0.2); color: $success-color; }
  &.street { background: rgba(250, 173, 20, 0.2); color: $warning-color; }
  &.community { background: rgba(146, 84, 222, 0.2); color: #9254de; }
  &.unit { background: rgba(19, 194, 194, 0.2); color: #13c2c2; }
}

.node-name {
  color: $text-primary;
  font-size: 14px;
}

.level-tag {
  transform: scale(0.85);
}

.node-stats {
  display: flex;
  gap: 12px;
  
  .stat {
    font-size: 12px;
    color: $text-muted;
    display: flex;
    align-items: center;
    gap: 3px;
    
    &.online {
      color: $success-color;
    }
  }
}

.detail-card {
  flex: 1;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    overflow-y: auto;
    @include scrollbar;
  }
}

.detail-content {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: $text-primary;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .label {
    font-size: 12px;
    color: $text-muted;
  }
  .value {
    font-size: 13px;
    color: $text-secondary;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-card {
  padding: 12px;
  text-align: center;
  border-radius: 4px;
  background: rgba(24, 144, 255, 0.05);
  border: 1px solid $border-color;
  
  .stat-num {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 12px;
    color: $text-muted;
  }
  
  &.total .stat-num { color: $primary-color; }
  &.online .stat-num { color: $success-color; }
  &.offline .stat-num { color: $error-color; }
  &.rate .stat-num { color: $warning-color; }
}

.action-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  gap: 15px;
  
  p {
    color: $text-muted;
    margin: 0;
  }
}

.list-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.node-level-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
  
  &.city { background: $primary-color; }
  &.district { background: $success-color; }
  &.street { background: $warning-color; }
  &.community { background: #9254de; }
  &.unit { background: #13c2c2; }
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

.text-success {
  color: $success-color;
}
</style>
