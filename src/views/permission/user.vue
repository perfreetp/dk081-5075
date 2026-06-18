<template>
  <div class="common-page">
    <div class="page-header">
      <div class="page-title">分级授权</div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
        <el-button @click="handleBatchImport">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
      </div>
    </div>
    
    <div class="user-layout">
      <el-card class="org-card">
        <template #header>
          <span class="card-title">组织架构</span>
        </template>
        <el-input
          v-model="searchOrg"
          placeholder="搜索组织"
          size="small"
          clearable
          class="org-search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-tree
          :data="orgData"
          :props="{ label: 'label', children: 'children' }"
          :filter-node-method="filterNode"
          default-expand-all
          node-key="id"
          highlight-current
          @node-click="handleOrgClick"
          class="org-tree"
        />
      </el-card>
      
      <div class="user-content">
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">用户列表（{{ total }}人）</span>
              <div class="filter-bar">
                <el-input
                  v-model="searchText"
                  placeholder="搜索用户"
                  size="small"
                  clearable
                  style="width: 180px;"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-select v-model="filterRole" placeholder="角色筛选" size="small" clearable style="width: 140px;">
                  <el-option label="市级管理员" value="市级管理员" />
                  <el-option label="区级管理员" value="区级管理员" />
                  <el-option label="街道管理员" value="街道管理员" />
                  <el-option label="街道操作员" value="街道操作员" />
                  <el-option label="重点单位" value="重点单位" />
                </el-select>
                <el-select v-model="filterStatus" placeholder="状态筛选" size="small" clearable style="width: 120px;">
                  <el-option label="在岗" value="on" />
                  <el-option label="离岗" value="off" />
                </el-select>
              </div>
            </div>
          </template>
          
          <el-table :data="tableData" stripe @row-click="handleUserClick">
            <el-table-column type="selection" width="50" />
            <el-table-column label="用户信息" min-width="180">
              <template #default="{ row }">
                <div class="user-info-cell">
                  <el-avatar :size="36" class="user-avatar">
                    {{ row.name.charAt(0) }}
                  </el-avatar>
                  <div class="user-detail">
                    <div class="user-name">{{ row.name }}</div>
                    <div class="user-phone">{{ row.phone }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.role)" size="small" effect="dark">
                  {{ row.role }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="org" label="所属组织" min-width="160" />
            <el-table-column prop="duty" label="值班状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="row.status === 'on' ? 'text-success' : 'text-muted'">
                  {{ row.duty }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="lastLogin" label="最后登录" width="170" />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-switch 
                  v-model="row.status" 
                  active-value="on" 
                  inactive-value="off"
                  @change="handleStatusChange(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" text @click.stop="handleEdit(row)">
                  <el-icon><Edit /></el-icon>编辑
                </el-button>
                <el-button type="success" size="small" text @click.stop="handlePermission(row)">
                  <el-icon><Key /></el-icon>权限
                </el-button>
                <el-button type="warning" size="small" text @click.stop="handleResetPwd(row)">
                  <el-icon><RefreshRight /></el-icon>重置密码
                </el-button>
                <el-button type="danger" size="small" text @click.stop="handleDelete(row)">
                  <el-icon><Delete /></el-icon>删除
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
      </div>
    </div>
    
    <el-dialog v-model="showPermissionDialog" title="权限配置" width="600px" class="permission-dialog">
      <div class="permission-user">
        <el-avatar :size="48" class="user-avatar">
          {{ currentUser?.name?.charAt(0) }}
        </el-avatar>
        <div class="user-info">
          <div class="user-name">{{ currentUser?.name }}</div>
          <div class="user-role">{{ currentUser?.role }} - {{ currentUser?.org }}</div>
        </div>
      </div>
      
      <el-tabs v-model="permissionTab">
        <el-tab-pane label="功能权限" name="function">
          <el-tree
            ref="funcTreeRef"
            :data="permissionTree"
            show-checkbox
            node-key="id"
            default-expand-all
            :default-checked-keys="checkedPermissions"
            class="perm-tree"
          />
        </el-tab-pane>
        <el-tab-pane label="数据权限" name="data">
          <el-tree
            ref="dataTreeRef"
            :data="orgData"
            show-checkbox
            node-key="id"
            default-expand-all
            :default-checked-keys="checkedOrgs"
            class="perm-tree"
          />
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePermission">保存</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑用户' : '新增用户'" width="550px" @close="resetUserForm">
      <el-form :model="userForm" :rules="formRules" ref="userFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="name">
              <el-input v-model="userForm.name" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%;">
                <el-option label="市级管理员" value="市级管理员" />
                <el-option label="区级管理员" value="区级管理员" />
                <el-option label="街道管理员" value="街道管理员" />
                <el-option label="街道操作员" value="街道操作员" />
                <el-option label="重点单位" value="重点单位" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属组织" prop="org">
              <el-select v-model="userForm.org" placeholder="请选择组织" style="width: 100%;">
                <el-option label="市级综治中心" value="市级综治中心" />
                <el-option label="东城区综治中心" value="东城区综治中心" />
                <el-option label="西城区综治中心" value="西城区综治中心" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="userForm.status" active-value="on" inactive-value="off" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="userForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false; resetUserForm()">取消</el-button>
        <el-button type="primary" @click="handleSaveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orgData } from '@/mock/data'
import { useAppStore } from '@/stores'

const store = useAppStore()

const searchText = ref('')
const searchOrg = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const showAddDialog = ref(false)
const showPermissionDialog = ref(false)
const isEdit = ref(false)
const currentUser = ref(null)
const permissionTab = ref('function')
const userFormRef = ref(null)
const funcTreeRef = ref(null)
const dataTreeRef = ref(null)
const editingUserId = ref(null)
const selectedOrg = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const userForm = reactive({
  id: '',
  name: '',
  phone: '',
  role: '',
  org: '',
  email: '',
  status: 'on',
  remark: ''
})

const formRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  org: [{ required: true, message: '请选择组织', trigger: 'change' }]
}

const permissionTree = [
  {
    id: '1',
    label: '资源接入',
    children: [
      { id: '1-1', label: '视频设备查看' },
      { id: '1-2', label: '视频设备管理' },
      { id: '1-3', label: '在线状态监测' }
    ]
  },
  {
    id: '2',
    label: '级联管理',
    children: [
      { id: '2-1', label: '级联关系查看' },
      { id: '2-2', label: '级联关系配置' },
      { id: '2-3', label: '组织树视图' },
      { id: '2-4', label: '地图视图' }
    ]
  },
  {
    id: '3',
    label: '事件处置',
    children: [
      { id: '3-1', label: '告警查看' },
      { id: '3-2', label: '告警分派' },
      { id: '3-3', label: '视频上墙' },
      { id: '3-4', label: '历史回放' },
      { id: '3-5', label: '跨部门会商' }
    ]
  },
  {
    id: '4',
    label: '统计报表',
    children: [
      { id: '4-1', label: '报表查看' },
      { id: '4-2', label: '报表导出' }
    ]
  },
  {
    id: '5',
    label: '权限中心',
    children: [
      { id: '5-1', label: '用户管理' },
      { id: '5-2', label: '权限配置' },
      { id: '5-3', label: '值班交接' },
      { id: '5-4', label: '操作审计' }
    ]
  }
]

const checkedPermissions = ref([])
const checkedOrgs = ref([])

const total = computed(() => filteredData.value.length)

const getOrgLabelForFilter = () => {
  if (!selectedOrg.value) return null
  return selectedOrg.value.label.replace('综治中心', '')
}

const filteredData = computed(() => {
  return store.users.filter(item => {
    if (selectedOrg.value) {
      const orgLabel = getOrgLabelForFilter()
      if (!item.org.includes(orgLabel) && item.org !== selectedOrg.value.label) {
        return false
      }
    }
    if (searchText.value && !item.name.includes(searchText.value) && !item.phone.includes(searchText.value)) {
      return false
    }
    if (filterRole.value && item.role !== filterRole.value) return false
    if (filterStatus.value && item.status !== filterStatus.value) return false
    return true
  })
})

const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const filterNode = (value, data) => {
  if (!value) return true
  return data.label.includes(value)
}

const getRoleTagType = (role) => {
  const map = {
    '市级管理员': 'danger',
    '区级管理员': 'warning',
    '街道管理员': 'success',
    '街道操作员': 'info',
    '重点单位': ''
  }
  return map[role] || ''
}

const resetUserForm = () => {
  userFormRef.value?.resetFields()
  Object.assign(userForm, {
    id: '',
    name: '',
    phone: '',
    role: '',
    org: '',
    email: '',
    status: 'on',
    remark: ''
  })
  isEdit.value = false
  editingUserId.value = null
}

const handleOrgClick = (data) => {
  selectedOrg.value = data
  pagination.page = 1
  ElMessage.info(`已筛选：${data.label}，当前显示 ${filteredData.value.length} 个用户`)
}

const handleUserClick = (row) => {
  currentUser.value = row
}

const handleEdit = (row) => {
  isEdit.value = true
  editingUserId.value = row.id
  Object.assign(userForm, {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    org: row.org,
    email: row.email || '',
    status: row.status,
    remark: row.remark || ''
  })
  showAddDialog.value = true
}

const handlePermission = (row) => {
  currentUser.value = row
  
  const savedPerms = store.userDataPermissions[row.id]
  if (savedPerms) {
    checkedPermissions.value = [...savedPerms.permissions]
    checkedOrgs.value = [...savedPerms.orgs]
  } else {
    checkedPermissions.value = ['1-1', '1-3', '2-1', '2-3', '2-4', '3-1', '3-3', '4-1']
    checkedOrgs.value = ['1', '1-1', '1-2']
  }
  
  showPermissionDialog.value = true
  
  nextTick(() => {
    if (funcTreeRef.value) {
      funcTreeRef.value.setCheckedKeys(checkedPermissions.value)
    }
    if (dataTreeRef.value) {
      dataTreeRef.value.setCheckedKeys(checkedOrgs.value)
    }
  })
}

const handleStatusChange = (row) => {
  ElMessage.success(`${row.name} 已${row.status === 'on' ? '启用' : '禁用'}`)
}

const handleResetPwd = (row) => {
  ElMessageBox.confirm(`确定要重置 ${row.name} 的密码吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('密码已重置为初始密码 123456')
  }).catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.name}" 吗？删除后列表和统计将同步更新。`, '提示', {
    type: 'warning'
  }).then(() => {
    store.removeUser(row.id)
    ElMessage.success(`用户 "${row.name}" 删除成功，当前共 ${store.users.length} 人`)
  }).catch(() => {})
}

const handleBatchImport = () => {
  ElMessage.info('批量导入功能')
}

const handleSaveUser = () => {
  userFormRef.value?.validate((valid) => {
    if (valid) {
      if (isEdit.value && editingUserId.value) {
        store.updateUser(editingUserId.value, { ...userForm })
        ElMessage.success(`用户 "${userForm.name}" 修改成功`)
      } else {
        const newUser = {
          name: userForm.name,
          phone: userForm.phone,
          role: userForm.role,
          org: userForm.org,
          email: userForm.email,
          status: userForm.status,
          remark: userForm.remark,
          duty: userForm.status === 'on' ? '在岗' : '离岗',
          lastLogin: '-'
        }
        store.addUser(newUser)
        ElMessage.success(`用户 "${userForm.name}" 新增成功，当前共 ${store.users.length} 人`)
      }
      showAddDialog.value = false
      resetUserForm()
    }
  })
}

const savePermission = () => {
  if (!currentUser.value) return
  
  const perms = funcTreeRef.value?.getCheckedKeys() || []
  const orgs = dataTreeRef.value?.getCheckedKeys() || []
  
  store.saveUserPermissions(currentUser.value.id, perms, orgs)
  
  checkedPermissions.value = [...perms]
  checkedOrgs.value = [...orgs]
  
  const isCurrent = store.currentUserId === currentUser.value.id
  const hint = isCurrent ? '（当前登录用户，数据范围已即时生效）' : ''
  ElMessage.success(`已保存 "${currentUser.value.name}" 的权限配置，共 ${perms.length} 项功能权限，${orgs.length} 项数据权限 ${hint}`)
  showPermissionDialog.value = false
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.user-layout {
  display: flex;
  gap: 16px;
  height: calc(100% - 60px);
}

.org-card {
  width: 260px;
  flex-shrink: 0;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    display: flex;
    flex-direction: column;
    padding: 15px;
  }
}

.org-search {
  margin-bottom: 10px;
}

.org-tree {
  flex: 1;
  overflow-y: auto;
  @include scrollbar;
  background: transparent;
  color: $text-secondary;
}

.user-content {
  flex: 1;
  min-width: 0;
}

.table-card {
  height: 100%;
  
  :deep(.el-card__body) {
    height: calc(100% - 57px);
    display: flex;
    flex-direction: column;
    padding-top: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
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

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  background: rgba(24, 144, 255, 0.2);
  color: $primary-color;
  flex-shrink: 0;
}

.user-detail {
  min-width: 0;
}

.user-name {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

.user-phone {
  font-size: 12px;
  color: $text-muted;
  margin-top: 2px;
}

.text-success {
  color: $success-color;
}

.text-muted {
  color: $text-muted;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.permission-dialog {
  .el-dialog__body {
    padding-top: 0;
  }
}

.permission-user {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px 0;
  border-bottom: 1px solid $border-color;
  margin-bottom: 10px;
  
  .user-avatar {
    width: 48px;
    height: 48px;
    background: rgba(24, 144, 255, 0.2);
    color: $primary-color;
  }
}

.user-info {
  .user-name {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }
  .user-role {
    font-size: 12px;
    color: $text-muted;
    margin-top: 4px;
  }
}

.perm-tree {
  max-height: 350px;
  overflow-y: auto;
  @include scrollbar;
  background: transparent;
  color: $text-secondary;
}
</style>
