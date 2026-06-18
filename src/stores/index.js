import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { deviceList as mockDeviceList, alarmList as mockAlarmList, userList as mockUserList, orgData } from '@/mock/data'

export const useAppStore = defineStore('app', () => {
  const devices = ref(JSON.parse(JSON.stringify(mockDeviceList)))
  const alarms = ref(JSON.parse(JSON.stringify(mockAlarmList)))
  const users = ref(JSON.parse(JSON.stringify(mockUserList)))

  const wallDevices = ref([])
  const playbackDevice = ref(null)
  const previewDevice = ref(null)

  const currentUserId = ref('1')
  const userDataPermissions = ref({})

  const initDefaultPermissions = () => {
    users.value.forEach(user => {
      if (!userDataPermissions.value[user.id]) {
        userDataPermissions.value[user.id] = {
          permissions: ['1-1', '1-3', '2-1', '2-3', '2-4', '3-1', '3-3', '4-1'],
          orgs: ['1', '1-1', '1-2', '1-3', '1-4']
        }
      }
    })
  }
  initDefaultPermissions()

  const currentUser = computed(() => {
    return users.value.find(u => u.id === currentUserId.value) || users.value[0]
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
    if (orgs.length === 0) return devices.value
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
      orgs: ['1', '1-1', '1-2']
    }
    return newUser
  }

  const updateUser = (userId, data) => {
    const idx = users.value.findIndex(u => u.id === userId)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...data }
    }
  }

  const removeUser = (userId) => {
    users.value = users.value.filter(u => u.id !== userId)
    delete userDataPermissions.value[userId]
  }

  return {
    devices,
    alarms,
    users,
    wallDevices,
    playbackDevice,
    previewDevice,
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
    updateAlarmStatus,
    assignAlarm,
    saveUserPermissions,
    addUser,
    updateUser,
    removeUser,
    initDefaultPermissions
  }
})
