import type { CatalogItem } from './types'
import type { Placement } from '../scene/Experience'

export interface Viewpoint {
  id: string
  title: string
  caption: string
  pos: [number, number, number]
  look: [number, number, number]
}

const EYE = 1.66
// 房间中心（用来把机位放在"成果朝向房间中心"的一侧）
const CENTER: [number, number] = [3.9, -4.2]

/** 由成果位置推出一个观察机位：距成果 2.1m，朝向成果 */
export function makeViewpoint(
  item: CatalogItem,
  layout: Record<string, Placement>,
  index: number,
): Viewpoint {
  const p = layout[item.id]
  const x = p ? p.x : item.world[0]
  const z = p ? p.z : item.world[2]
  const dx = x - CENTER[0]
  const dz = z - CENTER[1]
  const d = Math.hypot(dx, dz) || 1
  const dist = 2.1
  const pos: [number, number, number] = [x - (dx / d) * dist, EYE, z - (dz / d) * dist]
  return {
    id: item.id,
    title: `${String(index + 1).padStart(2, '0')} · ${item.name}`,
    caption: item.summary || '该成果暂无介绍',
    pos,
    look: [x, item.top - 0.15, z],
  }
}

export function buildTour(items: CatalogItem[], layout: Record<string, Placement>): Viewpoint[] {
  // 先房间整体，再逐件成果
  const intro: Viewpoint = {
    id: '__intro__',
    title: '00 · 劳模创新工作室',
    caption: '从入口望向创新成果展墙——这里陈列着工作室近年来的通信技术攻关成果。',
    pos: [3.6, EYE, -3.6],
    look: [3.4, 1.45, -0.6],
  }
  const items2 = items.map((it, i) => makeViewpoint(it, layout, i))
  const wallA: Viewpoint = {
    id: '__mural__',
    title: `0${items.length + 1} · 西侧主题壁画`,
    caption: '风电场、输电线路与通信塔——这面壁画概括了电力通信人的工作场景。',
    pos: [3.4, EYE, -4.6],
    look: [0.1, 1.7, -2.2],
  }
  const wallF: Viewpoint = {
    id: '__intro_board__',
    title: `0${items.length + 2} · 工作室简介与领军人物`,
    caption: '北墙是工作室简介与五位领军人物的介绍，进门第一眼即可看到。',
    pos: [3.4, EYE, -6.2],
    look: [2.9, 1.6, -8.3],
  }
  return [intro, ...items2, wallA, wallF]
}
