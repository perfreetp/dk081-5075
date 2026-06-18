import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '指挥总览', icon: 'Monitor' }
      },
      {
        path: 'resource',
        name: 'Resource',
        redirect: '/resource/device',
        meta: { title: '资源接入', icon: 'Connection' },
        children: [
          {
            path: 'device',
            name: 'ResourceDevice',
            component: () => import('@/views/resource/device.vue'),
            meta: { title: '视频设备', icon: 'VideoCamera' }
          },
          {
            path: 'status',
            name: 'ResourceStatus',
            component: () => import('@/views/resource/status.vue'),
            meta: { title: '在线状态', icon: 'Odometer' }
          }
        ]
      },
      {
        path: 'cascade',
        name: 'Cascade',
        redirect: '/cascade/relation',
        meta: { title: '级联管理', icon: 'Share' },
        children: [
          {
            path: 'relation',
            name: 'CascadeRelation',
            component: () => import('@/views/cascade/relation.vue'),
            meta: { title: '级联关系', icon: 'Share' }
          },
          {
            path: 'org-tree',
            name: 'CascadeOrgTree',
            component: () => import('@/views/cascade/org-tree.vue'),
            meta: { title: '组织树视图', icon: 'Menu' }
          },
          {
            path: 'map',
            name: 'CascadeMap',
            component: () => import('@/views/cascade/map.vue'),
            meta: { title: '地图视图', icon: 'LocationInformation' }
          }
        ]
      },
      {
        path: 'event',
        name: 'Event',
        redirect: '/event/alarm',
        meta: { title: '事件处置', icon: 'Warning' },
        children: [
          {
            path: 'alarm',
            name: 'EventAlarm',
            component: () => import('@/views/event/alarm.vue'),
            meta: { title: '告警分派', icon: 'Bell' }
          },
          {
            path: 'video-wall',
            name: 'EventVideoWall',
            component: () => import('@/views/event/video-wall.vue'),
            meta: { title: '视频上墙', icon: 'Monitor' }
          },
          {
            path: 'playback',
            name: 'EventPlayback',
            component: () => import('@/views/event/playback.vue'),
            meta: { title: '历史回溯', icon: 'Clock' }
          },
          {
            path: 'conference',
            name: 'EventConference',
            component: () => import('@/views/event/conference.vue'),
            meta: { title: '跨部门会商', icon: 'ChatDotRound' }
          }
        ]
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('@/views/report/index.vue'),
        meta: { title: '统计报表', icon: 'DataAnalysis' }
      },
      {
        path: 'permission',
        name: 'Permission',
        redirect: '/permission/user',
        meta: { title: '权限中心', icon: 'Lock' },
        children: [
          {
            path: 'user',
            name: 'PermissionUser',
            component: () => import('@/views/permission/user.vue'),
            meta: { title: '分级授权', icon: 'User' }
          },
          {
            path: 'duty',
            name: 'PermissionDuty',
            component: () => import('@/views/permission/duty.vue'),
            meta: { title: '值班交接', icon: 'Calendar' }
          },
          {
            path: 'audit',
            name: 'PermissionAudit',
            component: () => import('@/views/permission/audit.vue'),
            meta: { title: '操作审计', icon: 'Document' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 市级综治中心级联指挥平台` : '市级综治中心级联指挥平台'
  next()
})

export default router
