export const orgData = [
  {
    id: '1',
    label: '市级综治中心',
    level: 'city',
    children: [
      {
        id: '1-1',
        label: '东城区综治中心',
        level: 'district',
        children: [
          {
            id: '1-1-1',
            label: '朝阳街道',
            level: 'street',
            children: [
              { id: '1-1-1-1', label: '朝阳社区', level: 'community' },
              { id: '1-1-1-2', label: '东风社区', level: 'community' }
            ]
          },
          {
            id: '1-1-2',
            label: '和平街道',
            level: 'street',
            children: [
              { id: '1-1-2-1', label: '和平社区', level: 'community' },
              { id: '1-1-2-2', label: '新华社区', level: 'community' }
            ]
          }
        ]
      },
      {
        id: '1-2',
        label: '西城区综治中心',
        level: 'district',
        children: [
          {
            id: '1-2-1',
            label: '建设街道',
            level: 'street',
            children: [
              { id: '1-2-1-1', label: '建设社区', level: 'community' },
              { id: '1-2-1-2', label: '光明社区', level: 'community' }
            ]
          }
        ]
      },
      {
        id: '1-3',
        label: '南城区综治中心',
        level: 'district',
        children: [
          {
            id: '1-3-1',
            label: '人民街道',
            level: 'street',
            children: [
              { id: '1-3-1-1', label: '人民社区', level: 'community' }
            ]
          }
        ]
      },
      {
        id: '1-4',
        label: '北城区综治中心',
        level: 'district',
        children: [
          {
            id: '1-4-1',
            label: '胜利街道',
            level: 'street',
            children: [
              { id: '1-4-1-1', label: '胜利社区', level: 'community' },
              { id: '1-4-1-2', label: '解放社区', level: 'community' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '2',
    label: '重点单位',
    level: 'unit',
    children: [
      { id: '2-1', label: '市公安局', level: 'unit' },
      { id: '2-2', label: '市消防支队', level: 'unit' },
      { id: '2-3', label: '市人民医院', level: 'unit' },
      { id: '2-4', label: '市交通局', level: 'unit' },
      { id: '2-5', label: '市教育局', level: 'unit' }
    ]
  }
]

export const deviceList = [
  { id: 'D001', name: '市政府广场监控', org: '市级综治中心', type: '球机', status: 'online', ip: '192.168.1.101', lat: 39.9042, lng: 116.4074, resolution: '1080P', brand: '海康威视' },
  { id: 'D002', name: '火车站出入口', org: '东城区综治中心', type: '枪机', status: 'online', ip: '192.168.1.102', lat: 39.9087, lng: 116.4205, resolution: '4K', brand: '大华' },
  { id: 'D003', name: '朝阳街道办事处', org: '东城区-朝阳街道', type: '半球', status: 'online', ip: '192.168.1.103', lat: 39.9120, lng: 116.4150, resolution: '720P', brand: '海康威视' },
  { id: 'D004', name: '和平路商业街', org: '东城区-和平街道', type: '球机', status: 'offline', ip: '192.168.1.104', lat: 39.9150, lng: 116.4080, resolution: '1080P', brand: '宇视' },
  { id: 'D005', name: '西城公园北门', org: '西城区综治中心', type: '枪机', status: 'online', ip: '192.168.1.105', lat: 39.9200, lng: 116.3900, resolution: '1080P', brand: '海康威视' },
  { id: 'D006', name: '建设街道社区中心', org: '西城区-建设街道', type: '半球', status: 'warning', ip: '192.168.1.106', lat: 39.9250, lng: 116.3850, resolution: '720P', brand: '大华' },
  { id: 'D007', name: '南城体育馆', org: '南城区综治中心', type: '球机', status: 'online', ip: '192.168.1.107', lat: 39.8950, lng: 116.4050, resolution: '4K', brand: '海康威视' },
  { id: 'D008', name: '人民医院急诊楼', org: '市人民医院', type: '枪机', status: 'online', ip: '192.168.1.108', lat: 39.9000, lng: 116.4250, resolution: '1080P', brand: '大华' },
  { id: 'D009', name: '市公安局指挥大厅', org: '市公安局', type: '球机', status: 'online', ip: '192.168.1.109', lat: 39.9070, lng: 116.3950, resolution: '1080P', brand: '海康威视' },
  { id: 'D010', name: '北城客运站', org: '北城区综治中心', type: '枪机', status: 'online', ip: '192.168.1.110', lat: 39.9300, lng: 116.4000, resolution: '4K', brand: '宇视' },
  { id: 'D011', name: '胜利街道办', org: '北城区-胜利街道', type: '半球', status: 'offline', ip: '192.168.1.111', lat: 39.9350, lng: 116.4100, resolution: '720P', brand: '海康威视' },
  { id: 'D012', name: '市教育局门口', org: '市教育局', type: '枪机', status: 'online', ip: '192.168.1.112', lat: 39.9100, lng: 116.3980, resolution: '1080P', brand: '大华' },
  { id: 'D013', name: '交通指挥中心', org: '市交通局', type: '球机', status: 'online', ip: '192.168.1.113', lat: 39.9020, lng: 116.4120, resolution: '1080P', brand: '海康威视' },
  { id: 'D014', name: '消防支队营区', org: '市消防支队', type: '枪机', status: 'online', ip: '192.168.1.114', lat: 39.9220, lng: 116.4180, resolution: '1080P', brand: '大华' },
  { id: 'D015', name: '东风社区卡口', org: '东城区-朝阳街道', type: '枪机', status: 'online', ip: '192.168.1.115', lat: 39.9080, lng: 116.4180, resolution: '1080P', brand: '海康威视' }
]

export const alarmList = [
  { id: 'A001', type: '入侵告警', level: 'high', device: '和平路商业街', location: '东城区和平街道', time: '2024-01-15 14:32:18', status: 'pending', handler: '', description: '检测到人员翻越围墙' },
  { id: 'A002', type: '火灾预警', level: 'high', device: '南城体育馆', location: '南城区人民街道', time: '2024-01-15 14:28:05', status: 'processing', handler: '张建国', description: '烟雾浓度超过阈值' },
  { id: 'A003', type: '人员聚集', level: 'medium', device: '火车站出入口', location: '东城区朝阳街道', time: '2024-01-15 14:15:30', status: 'pending', handler: '', description: '检测到10人以上聚集' },
  { id: 'A004', type: '设备离线', level: 'low', device: '建设街道社区中心', location: '西城区建设街道', time: '2024-01-15 13:50:22', status: 'resolved', handler: '李明', description: '网络连接中断，已恢复' },
  { id: 'A005', type: '违停检测', level: 'low', device: '西城公园北门', location: '西城区建设街道', time: '2024-01-15 13:45:10', status: 'resolved', handler: '王芳', description: '车辆违停超过30分钟' },
  { id: 'A006', type: '打架斗殴', level: 'high', device: '朝阳街道办事处', location: '东城区朝阳街道', time: '2024-01-15 13:20:45', status: 'resolved', handler: '张建国', description: '检测到肢体冲突行为' },
  { id: 'A007', type: '遗留物品', level: 'medium', device: '市政府广场监控', location: '市级综治中心', time: '2024-01-15 12:55:33', status: 'pending', handler: '', description: '发现无人看管的包裹' },
  { id: 'A008', type: '超速行驶', level: 'low', device: '北城客运站', location: '北城区胜利街道', time: '2024-01-15 12:30:18', status: 'resolved', handler: '赵伟', description: '车辆超速行驶' }
]

export const userList = [
  { id: 1, name: '张建国', role: '市级管理员', org: '市级综治中心', phone: '13800138001', email: 'zhangjg@city.gov.cn', status: 'on', duty: '值班中', lastLogin: '2024-01-15 08:00:00' },
  { id: 2, name: '李明', role: '区级管理员', org: '东城区综治中心', phone: '13800138002', email: 'liming@east.gov.cn', status: 'on', duty: '值班中', lastLogin: '2024-01-15 08:30:00' },
  { id: 3, name: '王芳', role: '区级管理员', org: '西城区综治中心', phone: '13800138003', email: 'wangfang@west.gov.cn', status: 'on', duty: '值班中', lastLogin: '2024-01-15 08:15:00' },
  { id: 4, name: '赵伟', role: '街道管理员', org: '北城区-胜利街道', phone: '13800138004', email: 'zhaowei@north.gov.cn', status: 'off', duty: '休息', lastLogin: '2024-01-14 18:00:00' },
  { id: 5, name: '陈静', role: '街道操作员', org: '南城区-人民街道', phone: '13800138005', email: 'chenjing@south.gov.cn', status: 'on', duty: '值班中', lastLogin: '2024-01-15 09:00:00' },
  { id: 6, name: '刘强', role: '重点单位', org: '市公安局', phone: '13800138006', email: 'liuqiang@police.gov.cn', status: 'on', duty: '值班中', lastLogin: '2024-01-15 07:30:00' },
  { id: 7, name: '周敏', role: '重点单位', org: '市消防支队', phone: '13800138007', email: 'zhoumin@fire.gov.cn', status: 'on', duty: '备勤', lastLogin: '2024-01-15 08:00:00' },
  { id: 8, name: '吴涛', role: '市级操作员', org: '市级综治中心', phone: '13800138008', email: 'wutao@city.gov.cn', status: 'off', duty: '休息', lastLogin: '2024-01-14 20:00:00' }
]

export const auditLogList = [
  { id: 1, user: '张建国', action: '视频上墙', target: '市政府广场监控', time: '2024-01-15 14:35:22', ip: '10.0.0.1', result: '成功' },
  { id: 2, user: '李明', action: '告警分派', target: '和平路商业街入侵告警', time: '2024-01-15 14:30:15', ip: '10.0.0.2', result: '成功' },
  { id: 3, user: '王芳', action: '历史回放', target: '西城公园北门', time: '2024-01-15 14:20:08', ip: '10.0.0.3', result: '成功' },
  { id: 4, user: '张建国', action: '用户登录', target: '系统登录', time: '2024-01-15 08:00:00', ip: '10.0.0.1', result: '成功' },
  { id: 5, user: '刘强', action: '跨部门会商', target: '火灾应急会商', time: '2024-01-15 14:28:30', ip: '10.0.0.6', result: '成功' },
  { id: 6, user: '周敏', action: '视频上墙', target: '南城体育馆', time: '2024-01-15 14:29:45', ip: '10.0.0.7', result: '成功' },
  { id: 7, user: '陈静', action: '告警处理', target: '人员聚集告警', time: '2024-01-15 14:16:20', ip: '10.0.0.5', result: '成功' },
  { id: 8, user: '赵伟', action: '值班交接', target: '胜利街道值班', time: '2024-01-14 18:00:00', ip: '10.0.0.4', result: '成功' },
  { id: 9, user: '吴涛', action: '权限修改', target: '陈静-新增视频回放权限', time: '2024-01-14 15:30:00', ip: '10.0.0.8', result: '成功' },
  { id: 10, user: '张建国', action: '系统配置', target: '级联关系配置', time: '2024-01-14 10:00:00', ip: '10.0.0.1', result: '成功' }
]

export const dutyRecords = [
  { id: 1, date: '2024-01-15', shift: '白班', startTime: '08:00', endTime: '18:00', onDuty: '张建国', offDuty: '吴涛', status: '进行中', handoverContent: '今日系统运行正常，待处理告警3条' },
  { id: 2, date: '2024-01-14', shift: '夜班', startTime: '18:00', endTime: '次日08:00', onDuty: '吴涛', offDuty: '张建国', status: '已完成', handoverContent: '夜间无重大事件，系统运行正常' },
  { id: 3, date: '2024-01-14', shift: '白班', startTime: '08:00', endTime: '18:00', onDuty: '张建国', offDuty: '吴涛', status: '已完成', handoverContent: '处理告警8起，其中2起重大告警已闭环' },
  { id: 4, date: '2024-01-13', shift: '夜班', startTime: '18:00', endTime: '次日08:00', onDuty: '吴涛', offDuty: '张建国', status: '已完成', handoverContent: '夜间系统稳定，无异常情况' },
  { id: 5, date: '2024-01-13', shift: '白班', startTime: '08:00', endTime: '18:00', onDuty: '张建国', offDuty: '吴涛', status: '已完成', handoverContent: '日常值班，完成设备巡检' }
]

export const conferenceList = [
  { id: 'C001', title: '火灾应急处置会商', sponsor: '市级综治中心', status: 'ongoing', startTime: '2024-01-15 14:28:00', participants: ['市公安局', '市消防支队', '南城区综治中心', '市人民医院'], description: '南城体育馆火灾预警应急处置会商' },
  { id: 'C002', title: '春节安保工作部署', sponsor: '市级综治中心', status: 'scheduled', startTime: '2024-01-16 09:00:00', participants: ['各区县综治中心', '市公安局', '市交通局'], description: '春节期间社会治安防控工作部署' },
  { id: 'C003', title: '周度工作例会', sponsor: '市级综治中心', status: 'ended', startTime: '2024-01-12 14:00:00', participants: ['各区县综治中心'], description: '本周工作总结及下周工作计划' },
  { id: 'C004', title: '入侵事件复盘会', sponsor: '东城区综治中心', status: 'ended', startTime: '2024-01-11 10:00:00', participants: ['市级综治中心', '东城区综治中心', '市公安局'], description: '和平路商业街入侵事件复盘分析' }
]
