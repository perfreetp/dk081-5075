<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">级联关系配置</div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>新增级联
        </el-button>
        <el-button @click="handleSync">
          <el-icon><Refresh /></el-icon>同步配置
        </el-button>
      </div>
    </div>
    
    <div class="relation-layout">
      <el-card class="org-tree-card">
        <template #header>
          <span class="card-title">组织架构</span>
        </template>
        <el-input
          v-model="searchText"
          placeholder="搜索组织"
          size="small"
          clearable
          class="tree-search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-tree
          ref="treeRef"
          :data="orgData"
          :props="{ label: 'label', children: 'children' }"
          :filter-node-method="filterNode"
          default-expand-all
          node-key="id"
          @node-click="handleNodeClick"
          class="org-tree"
        >
          <template #default="{ node, data }">
            <span class="tree-node-content">
              <span class="node-dot" :class="data.level"></span>
              <span class="node-label">{{ node.label }}</span>
              <el-tag v-if="data.level === 'city'" size="small" type="primary" effect="dark">市级</el-tag>
              <el-tag v-else-if="data.level === 'district'" size="small" type="success" effect="dark">区级</el-tag>
              <el-tag v-else-if="data.level === 'street'" size="small" type="warning" effect="dark">街道</el-tag>
              <el-tag v-else-if="data.level === 'community'" size="small" effect="dark">社区</el-tag>
              <el-tag v-else size="small" type="info" effect="dark">单位</el-tag>
            </span>
          </template>
        </el-tree>
      </el-card>
      
      <div class="relation-content">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ selectedNode ? selectedNode.label : '请选择组织' }}</span>
              <span v-if="selectedNode" class="node-level-tag" :class="selectedNode.level">
                {{ getLevelText(selectedNode.level) }}
              </span>
            </div>
          </template>
          
          <div v-if="selectedNode" class="detail-content">
            <div class="info-section">
              <h4>基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">组织编码：</span>
                  <span class="value">{{ selectedNode.id }}</span>
                </div>
                <div class="info-item">
                  <span class="label">组织级别：</span>
                  <span class="value">{{ getLevelText(selectedNode.level) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">上级组织：</span>
                  <span class="value">{{ parentNode ? parentNode.label : '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">下级数量：</span>
                  <span class="value">{{ childCount }}</span>
                </div>
                <div class="info-item">
                  <span class="label">视频设备：</span>
                  <span class="value highlight">{{ deviceCount }} 台</span>
                </div>
                <div class="info-item">
                  <span class="label">在线设备：</span>
                  <span class="value success">{{ onlineDeviceCount }} 台</span>
                </div>
              </div>
            </div>
            
            <el-divider />
            
            <div class="cascade-section">
              <div class="section-header">
                <h4>级联关系</h4>
                <el-button type="primary" size="small" @click="showAddDialog = true">
                  <el-icon><Link /></el-icon>配置级联
                </el-button>
              </div>
              
              <el-table :data="cascadeList" size="small" stripe>
                <el-table-column prop="targetName" label="级联目标" min-width="150" />
                <el-table-column prop="targetLevel" label="级别" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" :type="getLevelTagType(row.targetLevel)">
                      {{ getLevelText(row.targetLevel) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="direction" label="级联方向" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.direction === 'up' ? 'primary' : 'success'">
                      {{ row.direction === 'up' ? '上级' : '下级' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'">
                      {{ row.status === 'active' ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="160" />
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" text @click="handleEditCascade(row)">
                      编辑
                    </el-button>
                    <el-button type="warning" size="small" text @click="handleToggleStatus(row)">
                      {{ row.status === 'active' ? '停用' : '启用' }}
                    </el-button>
                    <el-button type="danger" size="small" text @click="handleDeleteCascade(row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          
          <div v-else class="empty-tip">
            <el-empty description="请从左侧选择组织查看级联关系" :image-size="100">
              <template #image>
                <el-icon :size="60" color="#1890ff"><Share /></el-icon>
              </template>
            </el-empty>
          </div>
        </el-card>
      </div>
    </div>
    
    <el-dialog v-model="showAddDialog" :title="editingCascadeId ? '编辑级联关系' : '新增级联关系'" width="600px" @close="resetCascadeForm">
      <el-form :model="cascadeForm" label-width="100px">
        <el-form-item label="源组织">
          <el-input :value="selectedNode?.label" disabled />
        </el-form-item>
        <el-form-item label="目标组织">
          <el-select v-model="cascadeForm.targetId" placeholder="请选择目标组织" style="width: 100%;">
            <el-option label="东城区综治中心" value="1-1" />
            <el-option label="西城区综治中心" value="1-2" />
            <el-option label="南城区综治中心" value="1-3" />
            <el-option label="北城区综治中心" value="1-4" />
            <el-option label="市公安局" value="2-1" />
            <el-option label="市消防支队" value="2-2" />
          </el-select>
        </el-form-item>
        <el-form-item label="级联方向">
          <el-radio-group v-model="cascadeForm.direction">
            <el-radio value="up">上级级联（向上推送）</el-radio>
            <el-radio value="down">下级级联（向下调用）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限配置">
          <el-checkbox-group v-model="cascadeForm.permissions">
            <el-checkbox value="view">实时查看</el-checkbox>
            <el-checkbox value="playback">历史回放</el-checkbox>
            <el-checkbox value="control">云台控制</el-checkbox>
            <el-checkbox value="wall">视频上墙</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="cascadeForm.status" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="cascadeForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false; resetCascadeForm()">取消</el-button>
        <el-button type="primary" @click="handleSaveCascade">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orgData, deviceList } from '@/mock/data'

const searchText = ref('')
const selectedNode = ref(null)
const parentNode = ref(null)
const showAddDialog = ref(false)
const treeRef = ref(null)
const editingCascadeId = ref(null)

const targetOrgMap = {
  '1-1': { name: '东城区综治中心', level: 'district' },
  '1-2': { name: '西城区综治中心', level: 'district' },
  '1-3': { name: '南城区综治中心', level: 'district' },
  '1-4': { name: '北城区综治中心', level: 'district' },
  '2-1': { name: '市公安局', level: 'unit' },
  '2-2': { name: '市消防支队', level: 'unit' }
}

const cascadeForm = reactive({
  targetId: '',
  direction: 'down',
  permissions: ['view', 'playback'],
  status: true,
  remark: ''
})

const cascadeList = ref([
  { id: 1, targetId: '1-1', targetName: '东城区综治中心', targetLevel: 'district', direction: 'down', permissions: ['view', 'playback'], status: 'active', createTime: '2024-01-01 10:00:00' },
  { id: 2, targetId: '1-2', targetName: '西城区综治中心', targetLevel: 'district', direction: 'down', permissions: ['view', 'playback', 'control'], status: 'active', createTime: '2024-01-01 10:05:00' },
  { id: 3, targetId: '1-3', targetName: '南城区综治中心', targetLevel: 'district', direction: 'down', permissions: ['view'], status: 'active', createTime: '2024-01-01 10:10:00' },
  { id: 4, targetId: '1-4', targetName: '北城区综治中心', targetLevel: 'district', direction: 'down', permissions: ['view', 'playback', 'wall'], status: 'active', createTime: '2024-01-01 10:15:00' },
  { id: 5, targetId: '2-1', targetName: '市公安局', targetLevel: 'unit', direction: 'down', permissions: ['view', 'playback', 'control', 'wall'], status: 'active', createTime: '2024-01-02 09:00:00' },
  { id: 6, targetId: '2-2', targetName: '市消防支队', targetLevel: 'unit', direction: 'down', permissions: ['view', 'control'], status: 'active', createTime: '2024-01-02 09:30:00' }
])

const childCount = computed(() => {
  if (!selectedNode.value?.children) return 0
  return selectedNode.value.children.length
})

const deviceCount = computed(() => {
  if (!selectedNode.value) return 0
  return deviceList.filter(d => d.org.includes(selectedNode.value.label.replace('综治中心', ''))).length
})

const onlineDeviceCount = computed(() => {
  if (!selectedNode.value) return 0
  return deviceList.filter(d => 
    d.org.includes(selectedNode.value.label.replace('综治中心', '')) && d.status === 'online'
  ).length
})

const filterNode = (value, data) => {
  if (!value) return true
  return data.label.includes(value)
}

const findParent = (node, targetId, parent = null) => {
  if (node.id === targetId) return parent
  if (node.children) {
    for (const child of node.children) {
      const result = findParent(child, targetId, node)
      if (result !== undefined) return result
    }
  }
  return undefined
}

const handleNodeClick = (data) => {
  selectedNode.value = data
  
  let parent = null
  for (const root of orgData) {
    const p = findParent(root, data.id)
    if (p) {
      parent = p
      break
    }
  }
  parentNode.value = parent
}

const getLevelText = (level) => {
  const map = {
    city: '市级',
    district: '区级',
    street: '街道',
    community: '社区',
    unit: '单位'
  }
  return map[level] || level
}

const getLevelTagType = (level) => {
  const map = {
    city: 'primary',
    district: 'success',
    street: 'warning',
    community: '',
    unit: 'info'
  }
  return map[level] || ''
}

const handleSync = () => {
  ElMessage.success('级联配置同步中...')
}

const resetCascadeForm = () => {
  cascadeForm.targetId = ''
  cascadeForm.direction = 'down'
  cascadeForm.permissions = ['view', 'playback']
  cascadeForm.status = true
  cascadeForm.remark = ''
  editingCascadeId.value = null
}

const handleEditCascade = (row) => {
  editingCascadeId.value = row.id
  cascadeForm.targetId = row.targetId
  cascadeForm.direction = row.direction
  cascadeForm.permissions = [...(row.permissions || ['view', 'playback'])]
  cascadeForm.status = row.status === 'active'
  cascadeForm.remark = row.remark || ''
  showAddDialog.value = true
}

const handleToggleStatus = (row) => {
  row.status = row.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`已${row.status === 'active' ? '启用' : '停用'}级联`)
}

const handleDeleteCascade = (row) => {
  ElMessageBox.confirm(`确定要删除与 "${row.targetName}" 的级联关系吗？删除后列表将同步更新。`, '提示', {
    type: 'warning'
  }).then(() => {
    cascadeList.value = cascadeList.value.filter(item => item.id !== row.id)
    ElMessage.success(`已删除与 "${row.targetName}" 的级联关系`)
  }).catch(() => {})
}

const handleSaveCascade = () => {
  if (!cascadeForm.targetId) {
    ElMessage.warning('请选择目标组织')
    return
  }
  
  const targetInfo = targetOrgMap[cascadeForm.targetId]
  if (!targetInfo) {
    ElMessage.warning('无效的目标组织')
    return
  }

  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  if (editingCascadeId.value) {
    const idx = cascadeList.value.findIndex(item => item.id === editingCascadeId.value)
    if (idx !== -1) {
      cascadeList.value[idx] = {
        ...cascadeList.value[idx],
        targetId: cascadeForm.targetId,
        targetName: targetInfo.name,
        targetLevel: targetInfo.level,
        direction: cascadeForm.direction,
        permissions: [...cascadeForm.permissions],
        status: cascadeForm.status ? 'active' : 'inactive',
        remark: cascadeForm.remark,
        updateTime: timeStr
      }
      ElMessage.success(`已更新与 "${targetInfo.name}" 的级联配置`)
    }
  } else {
    const maxId = cascadeList.value.length > 0 ? Math.max(...cascadeList.value.map(i => i.id)) : 0
    cascadeList.value.unshift({
      id: maxId + 1,
      targetId: cascadeForm.targetId,
      targetName: targetInfo.name,
      targetLevel: targetInfo.level,
      direction: cascadeForm.direction,
      permissions: [...cascadeForm.permissions],
      status: cascadeForm.status ? 'active' : 'inactive',
      remark: cascadeForm.remark,
      createTime: timeStr
    })
    ElMessage.success(`已新增与 "${targetInfo.name}" 的级联配置`)
  }

  showAddDialog.value = false
  resetCascadeForm()
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.relation-layout {
  display: flex;
  gap: 16px;
  height: calc(100% - 60px);
}

.org-tree-card {
  width: 300px;
  flex-shrink: 0;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    display: flex;
    flex-direction: column;
    padding: 15px;
  }
}

.tree-search {
  margin-bottom: 10px;
}

.org-tree {
  flex: 1;
  overflow-y: auto;
  @include scrollbar;
  background: transparent;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.node-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.city { background: $primary-color; }
  &.district { background: $success-color; }
  &.street { background: $warning-color; }
  &.community { background: #9254de; }
  &.unit { background: #13c2c2; }
}

.node-label {
  flex: 1;
  min-width: 0;
}

.relation-content {
  flex: 1;
  min-width: 0;
}

.detail-card {
  height: 100%;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    overflow-y: auto;
    @include scrollbar;
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

.node-level-tag {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(24, 144, 255, 0.1);
  color: $primary-color;
  
  &.city { background: rgba(24, 144, 255, 0.2); color: $primary-color; }
  &.district { background: rgba(82, 196, 26, 0.2); color: $success-color; }
  &.street { background: rgba(250, 173, 20, 0.2); color: $warning-color; }
  &.community { background: rgba(146, 84, 222, 0.2); color: #9254de; }
  &.unit { background: rgba(19, 194, 194, 0.2); color: #13c2c2; }
}

.detail-content {
  padding: 10px 0;
}

.info-section {
  h4 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: $text-primary;
    font-weight: 600;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.info-item {
  .label {
    color: $text-muted;
    font-size: 13px;
  }
  .value {
    color: $text-secondary;
    font-size: 13px;
    
    &.highlight {
      color: $primary-color;
      font-weight: 600;
    }
    &.success {
      color: $success-color;
      font-weight: 600;
    }
  }
}

.cascade-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    h4 {
      margin: 0;
      font-size: 14px;
      color: $text-primary;
      font-weight: 600;
    }
  }
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}
</style>
