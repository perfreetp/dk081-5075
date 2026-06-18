<template>
  <div class="layout-container">
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="logo">
        <span class="logo-icon">
          <el-icon :size="24"><Monitor /></el-icon>
        </span>
        <span v-if="!isCollapsed" class="logo-text">综治级联指挥</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        router
        class="side-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <template #title>指挥总览</template>
        </el-menu-item>
        
        <el-sub-menu index="resource">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>资源接入</span>
          </template>
          <el-menu-item index="/resource/device">视频设备</el-menu-item>
          <el-menu-item index="/resource/status">在线状态</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="cascade">
          <template #title>
            <el-icon><Share /></el-icon>
            <span>级联管理</span>
          </template>
          <el-menu-item index="/cascade/relation">级联关系</el-menu-item>
          <el-menu-item index="/cascade/org-tree">组织树视图</el-menu-item>
          <el-menu-item index="/cascade/map">地图视图</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="event">
          <template #title>
            <el-icon><Warning /></el-icon>
            <span>事件处置</span>
          </template>
          <el-menu-item index="/event/alarm">告警分派</el-menu-item>
          <el-menu-item index="/event/video-wall">视频上墙</el-menu-item>
          <el-menu-item index="/event/playback">历史回溯</el-menu-item>
          <el-menu-item index="/event/conference">跨部门会商</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/report">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>统计报表</template>
        </el-menu-item>
        
        <el-sub-menu index="permission">
          <template #title>
            <el-icon><Lock /></el-icon>
            <span>权限中心</span>
          </template>
          <el-menu-item index="/permission/user">分级授权</el-menu-item>
          <el-menu-item index="/permission/duty">值班交接</el-menu-item>
          <el-menu-item index="/permission/audit">操作审计</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    
    <div class="main-container">
      <header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="current-time">
            <el-icon><Clock /></el-icon>
            <span>{{ currentTime }}</span>
          </div>
          <el-badge :value="alarmCount" class="alarm-badge" type="danger">
            <el-icon class="header-icon" @click="goToAlarm"><Bell /></el-icon>
          </el-badge>
          <div class="user-info" @click="showUserSwitch = !showUserSwitch">
            <el-avatar :size="32" class="user-avatar">
              {{ currentUserName.charAt(0) }}
            </el-avatar>
            <div class="user-detail">
              <span class="user-name">{{ currentUserName }}</span>
              <span class="user-role">{{ currentUserRole }}</span>
            </div>
            <el-dropdown trigger="click" @visible-change="(v) => showUserSwitch = v">
              <el-icon><CaretBottom /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled style="opacity:1; cursor:default; padding:8px 16px;">
                    <div style="font-size:12px; color:#909399;">切换登录用户（测试权限）</div>
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-for="u in store.users"
                    :key="u.id"
                    @click.stop="switchUser(u.id)"
                    :class="{ active: store.currentUserId === u.id }"
                  >
                    <span style="display:inline-block; width:120px;">{{ u.name }}</span>
                    <span style="color:#909399; font-size:12px;">{{ u.role }}</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided>个人中心</el-dropdown-item>
                  <el-dropdown-item>修改密码</el-dropdown-item>
                  <el-dropdown-item divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>
      
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const isCollapsed = ref(false)
const currentTime = ref('')
const showUserMenu = ref(false)
const showUserSwitch = ref(false)
let timer = null

const activeMenu = computed(() => route.path)

const alarmCount = computed(() => store.pendingAlarmCount)

const currentUserName = computed(() => store.currentUser?.name || '张建国')
const currentUserRole = computed(() => store.currentUser?.role || '市级管理员')

const switchUser = (userId) => {
  store.currentUserId = userId
  ElMessage.success(`已切换到用户：${store.currentUser?.name}，权限范围已更新`)
  showUserSwitch.value = false
}

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }))
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const updateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const goToAlarm = () => {
  router.push('/event/alarm')
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.layout-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 220px;
  background: $bg-darker;
  border-right: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  
  &.collapsed {
    width: 64px;
  }
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 1px solid $border-color;
  color: $primary-color;
  font-weight: 700;
  font-size: 16px;
}

.logo-icon {
  font-size: 24px;
}

.side-menu {
  flex: 1;
  padding-top: 10px;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 60px;
  background: $bg-darker;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: $text-secondary;
  
  &:hover {
    color: $primary-color;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.currentTime {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $text-secondary;
  font-size: 14px;
}

.header-icon {
  font-size: 20px;
  color: $text-secondary;
  cursor: pointer;
  
  &:hover {
    color: $primary-color;
  }
}

.alarm-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(24, 144, 255, 0.08);
    .user-name {
      color: $primary-color;
    }
  }
}

.user-avatar {
  background: rgba(24, 144, 255, 0.2);
  color: $primary-color;
}

.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  color: $text-secondary;
  font-size: 13px;
  font-weight: 500;
}

.user-role {
  color: $text-muted;
  font-size: 11px;
  margin-top: 2px;
}

:deep(.el-dropdown-menu__item.active) {
  background: rgba(24, 144, 255, 0.12);
  color: $primary-color;
  font-weight: 500;
}

.main-content {
  flex: 1;
  overflow: hidden;
  background: $bg-dark;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
