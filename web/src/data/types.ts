export interface CatalogItem {
  id: string
  uid: string
  name: string
  code: string
  category: string
  summary: string
  photo: string | null
  thumb: string | null
  world: [number, number, number]
  top: number
  rotation: number
  scale: number
  demo: boolean
}

export interface Catalog {
  scene: { name: string; plan: { width: number; depth: number; wallHeight: number } }
  items: CatalogItem[]
}
