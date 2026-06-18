import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { deviceList as mockDeviceList, alarmList as mockAlarmList, userList as mockUserList, orgData } from '@/mock/data'

const STORAGE_KEY = 'cascade-platform-state-v1'

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {}
}

export const useAppStore = defineStore('app', () => {
  const persisted = loadState()

  const devices = ref(persisted?.devices ? JSON.parse(JSON.stringify(persisted.devices)) : JSON.parse(JSON.stringify(mockDeviceList)))
  const alarms = ref(persisted?.alarms ? JSON.parse(JSON.stringify(persisted.alarms)) : JSON.parse(JSON.stringify(mockAlarmList)))
  const users = ref((persisted?.users ? JSON.parse(JSON.stringify(persisted.users)) : JSON.parse(JSON.stringify(mockUserList))).map(u => ({ ...u, id: String(u.id) })))

  const wallDevices = ref([])
  const playbackDevice = ref(null)
  const previewDevice = ref(null)
  const mapFocusDevice = ref(null)

  const currentUserId = ref(String(persisted?.currentUserId ?? '1'))
  const userDataPermissions = ref(persisted?.userDataPermissions ? JSON.parse(JSON.stringify(persisted.userDataPermissions)) : {})

  const getDefaultOrgsByUser = (user) => {
    const org = user.org || ''
    if (org === '市级综治中心') return []
    if (org.includes('东城区')) return ['1-1']
    if (org.includes('西城区')) return ['1-2']
    if (org.includes('南城区')) return ['1-3']
    if (org.includes('北城区')) return ['1-4']
    if (org.includes('市公安局')) return ['2-1']
    if (org.includes('市消防支队')) return ['2-2']
    if (org.includes('市人民医院')) return ['2-3']
    if (org.includes('市交通局')) return ['2-4']
    if (org.includes('市教育局')) return ['2-5']
    return []
  }

  const initDefaultPermissions = () => {
    users.value.forEach(user => {
      if (!userDataPermissions.value[user.id]) {
        userDataPermissions.value[user.id] = {
          permissions: ['1-1', '1-3', '2-1', '2-3', '2-4', '3-1', '3-3', '4-1'],
          orgs: getDefaultOrgsByUser(user)
        }
      }
    })
  }
  initDefaultPermissions()

  watch([devices, alarms, users, userDataPermissions, currentUserId], () => {
    saveState({
      devices: devices.value,
      alarms: alarms.value,
      users: users.value,
      userDataPermissions: userDataPermissions.value,
      currentUserId: currentUserId.value
    })
  }, { deep: true })

  const currentUser = computed(() => {
    return users.value.find(u => String(u.id) === String(currentUserId.value)) || users.value[0]
  })

  const currentUserPerms = computed(() => {
    return userDataPermissions.value[currentUserId.value] || { permissions: [], orgs: [] }
  })

  const getOrgLabelsByIds = (ids) => {
    if (ids.length === 0) return []
    const orgLabels = []
    const collectLabels = (nodes) => {
      for (const n of nodes) {
        if (ids.includes(n.id)) {
          orgLabels.push(n.label.replace('综治中心', ''))
        }
        if (n.children) collectLabels(n.children)
      }
    }
    collectLabels(orgData)
    return orgLabels
  }

  const visibleDevices = computed(() => {
    const orgs = currentUserPerms.value.orgs
    if (!orgs || orgs.length === 0) return devices.value
    const orgLabels = getOrgLabelsByIds(orgs)
    return devices.value.filter(d => {
      return orgLabels.some(label => d.org.includes(label))
    })
  })

  const pendingAlarmCount = computed(() => {
    return alarms.value.filter(a => a.status === 'pending').length
  })

  const addToWall = (device) => {
    if (!device) return
    if (!wallDevices.value.find(d => d.id === device.id)) {
      wallDevices.value.push({ ...device })
    }
  }

  const removeFromWall = (deviceId) => {
    wallDevices.value = wallDevices.value.filter(d => d.id !== deviceId)
  }

  const clearWall = () => {
    wallDevices.value = []
  }

  const setPlaybackDevice = (device) => {
    playbackDevice.value = device ? { ...device } : null
  }

  const setPreviewDevice = (device) => {
    previewDevice.value = device ? { ...device } : null
  }

  const setMapFocusDevice = (device) => {
    mapFocusDevice.value = device ? { ...device } : null
  }

  const updateAlarmStatus = (alarmId, status) => {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm) {
      alarm.status = status
      if (status !== 'pending') {
        alarm.handleTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      }
    }
  }

  const assignAlarm = (alarmId, assignee) => {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm) {
      alarm.assignee = assignee
      alarm.handler = assignee
      alarm.status = 'processing'
      alarm.handleTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    }
  }

  const saveUserPermissions = (userId, perms, orgs) => {
    userDataPermissions.value[userId] = {
      permissions: [...perms],
      orgs: [...orgs]
    }
  }

  const addUser = (user) => {
    const maxId = users.value.length > 0 ? Math.max(...users.value.map(u => parseInt(u.id) || 0)) : 0
    const newUser = { ...user, id: String(maxId + 1) }
    users.value.unshift(newUser)
    userDataPermissions.value[newUser.id] = {
      permissions: ['1-1', '1-3', '2-1', '2-3', '2-4', '3-1', '3-3', '4-1'],
      orgs: getDefaultOrgsByUser(newUser)
    }
    return newUser
  }

  const updateUser = (userId, data) => {
    const idx = users.value.findIndex(u => String(u.id) === String(userId))
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...data }
    }
  }

  const removeUser = (userId) => {
    users.value = users.value.filter(u => String(u.id) !== String(userId))
    delete userDataPermissions.value[userId]
  }

  return {
    devices,
    alarms,
    users,
    wallDevices,
    playbackDevice,
    previewDevice,
    mapFocusDevice,
    currentUserId,
    userDataPermissions,
    currentUser,
    currentUserPerms,
    visibleDevices,
    pendingAlarmCount,
    addToWall,
    removeFromWall,
    clearWall,
    setPlaybackDevice,
    setPreviewDevice,
    setMapFocusDevice,
    updateAlarmStatus,
    assignAlarm,
    saveUserPermissions,
    addUser,
    updateUser,
    removeUser,
    initDefaultPermissions
  }
})
