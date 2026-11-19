export type Category = '实物装置' | '荣誉表彰' | '影像资料' | '软件系统' | '文化墙'

export interface Achievement {
  id: string
  code: string
  name: string
  category: Category
  year: string
  intro: string
  demo: boolean
  media: number
  shape: 'gear' | 'robot' | 'wall' | 'screen' | 'panel'
  at: { x: number; z: number; rotY: number }
}

// 假数据：待 spec-003 管理端接入后改为接口数据
export const achievements: Achievement[] = [
  {
    id: 'ah-01', code: 'AH-01', name: '高压带电作业工装', category: '实物装置', year: '2023',
    intro: '为 10kV 高压线路带电检修研制的全套防护工装，绝缘等级提升 2 级，将作业安全距离缩短 40%，已在 12 个地市推广使用，累计完成带电作业 3000 余次。',
    demo: true, media: 3, shape: 'gear', at: { x: -1.6, z: -2.6, rotY: 0.25 },
  },
  {
    id: 'ah-02', code: 'AH-02', name: '智能巡检机器人', category: '实物装置', year: '2024',
    intro: '面向变电站室内巡检的轮式机器人，搭载红外与可见光双光云台，自主完成表计读数、温度异常与局放初筛，单机可替代 2 人日常巡检。',
    demo: true, media: 2, shape: 'robot', at: { x: 1.8, z: -2.4, rotY: -0.3 },
  },
  {
    id: 'ah-03', code: 'AH-03', name: '国家级荣誉墙', category: '荣誉表彰', year: '2022',
    intro: '集中陈列工作室获得的全国工人先锋号、全国五一劳动奖状等 12 项国家级荣誉与 20 余项省部级表彰。',
    demo: false, media: 1, shape: 'wall', at: { x: -3.3, z: -3.6, rotY: 0 },
  },
  {
    id: 'ah-04', code: 'AH-04', name: '输电智能巡检平台', category: '软件系统', year: '2024',
    intro: '融合无人机与地面视频的输电通道智能巡检平台，缺陷识别准确率 92%，巡检计划编排效率提升 3 倍。',
    demo: false, media: 2, shape: 'screen', at: { x: 5.2, z: -0.6, rotY: -Math.PI / 2 },
  },
  {
    id: 'ah-05', code: 'AH-05', name: '劳模纪录片', category: '影像资料', year: '2023',
    intro: '记录工作室带头人 28 年一线检修生涯的 12 分钟纪录片，含重大抢修现场影像与同事访谈。',
    demo: false, media: 1, shape: 'screen', at: { x: -5.2, z: 0.8, rotY: Math.PI / 2 },
  },
  {
    id: 'ah-06', code: 'AH-06', name: '工作室简介', category: '文化墙', year: '2021',
    intro: '工作室成立于 2016 年，现有成员 26 人，累计完成技术创新项目 47 项，取得专利 31 件，培养高级技师 9 名。',
    demo: false, media: 0, shape: 'panel', at: { x: -0.6, z: 3.6, rotY: Math.PI },
  },
]

export const ROOM = { w: 12, d: 8, h: 3.2 }
