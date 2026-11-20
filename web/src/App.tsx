import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import Experience, { type EditApi, type Placement } from './scene/Experience'
import Hud from './components/Hud'
import DetailDrawer from './components/DetailDrawer'
import Loading from './components/Loading'
import AdminLogin from './components/AdminLogin'
import EditBar from './components/EditBar'
import LibraryPanel from './components/LibraryPanel'
import TourBar from './components/TourBar'
import { buildTour } from './data/tour'
import type { Catalog, CatalogItem } from './data/types'

const WEBGL_OK = (() => {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    const ok = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
})()

export interface FlyTarget {
  pos: [number, number, number]
  look: [number, number, number]
  key: number
}

const START: [number, number, number] = [3.6, 1.66, -3.7]
const LAYOUT_KEY = 'lm-layout-v1'

const loadLayout = (): Record<string, Placement> => {
  try {
    return JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}')
  } catch {
    return {}
  }
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [fly, setFly] = useState<FlyTarget | null>(null)
  const [guide, setGuide] = useState(() => localStorage.getItem('lm-guide') !== '1')
  const [toast, setToast] = useState<string | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editSelected, setEditSelected] = useState<string | null>(null)
  const [layout, setLayout] = useState<Record<string, Placement>>(loadLayout)
  const [dirty, setDirty] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const expRef = useRef<EditApi>(null)
  const [tourIndex, setTourIndex] = useState<number | null>(null)
  const tourIndexRef = useRef<number | null>(null)
  tourIndexRef.current = tourIndex
  const gotoRef = useRef<(i: number) => void>(() => {})

  // 布展状态：目录默认值 + 本次调整
  const placedMap = useMemo(() => {
    const m: Record<string, boolean> = {}
    catalog?.items.forEach((i) => {
      m[i.id] = layout[i.id]?.placed ?? i.placed !== false
    })
    return m
  }, [catalog, layout])

  const viewItems = (catalog?.items ?? []).filter((i) => placedMap[i.id])

  const tour = useMemo(() => buildTour(viewItems, layout), [viewItems, layout])
  const { active, progress } = useProgress()

  useEffect(() => {
    fetch('/assets/catalog.json')
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => setToast('成果数据加载失败'))
  }, [])

  const loading = !catalog || (active && progress < 100)

  const goCenter = () => {
    setFly({ pos: [START[0], START[1], START[2]], look: [START[0], 1.4, START[2] + 2], key: Date.now() })
  }

  const focus = (item: CatalogItem) => {
    const [x, , z] = item.world
    const dx = x - 5.6
    const dz = z + 4.2
    const d = Math.hypot(dx, dz) || 1
    const pos: [number, number, number] = [x - (dx / d) * 1.7, 1.66, z - (dz / d) * 1.7]
    setFly({ pos, look: [x, item.top - 0.2, z], key: Date.now() })
    setSelected(item)
    setPlaying(null)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null)
        setPlaying(null)
        setTourIndex(null)
      }
      if (tourIndexRef.current !== null) {
        if (e.key === 'ArrowRight') gotoRef.current(tourIndexRef.current + 1)
        if (e.key === 'ArrowLeft') gotoRef.current(tourIndexRef.current - 1)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // 放入场景的默认落点：展台前与椭圆桌之间的空地（保证在初始视野内）
  const SPOTS = [
    { x: 2.25, z: -1.55 }, { x: 5.15, z: -1.55 },
    { x: 2.25, z: -2.55 }, { x: 5.15, z: -2.55 },
    { x: 3.70, z: -1.35 }, { x: 3.70, z: -2.75 },
  ]
  const spotFor = () => {
    const n = Object.values(placedMap).filter(Boolean).length
    return SPOTS[n % SPOTS.length]
  }

  const placeItem = (item: CatalogItem) => {
    const spot = spotFor()
    setLayout((prev) => ({ ...prev, [item.id]: { x: spot.x, z: spot.z, rotY: 0, placed: true } }))
    setEditSelected(item.id)
    setDirty(true)
    showToast(`已放入场景：${item.name}`)
  }

  const removeItem = (item: CatalogItem) => {
    setLayout((prev) => ({ ...prev, [item.id]: { x: 0, z: 0, rotY: 0, placed: false } }))
    if (editSelected === item.id) setEditSelected(null)
    setDirty(true)
    showToast(`已撤展：${item.name}`)
  }

  const gotoStep = (i: number) => {
    if (!tour.length) return
    const idx = Math.max(0, Math.min(tour.length - 1, i))
    const vp = tour[idx]
    setTourIndex(idx)
    setSelected(null)
    setPlaying(null)
    setFly({ pos: vp.pos, look: vp.look, key: Date.now() })
  }

  gotoRef.current = gotoStep

  const startTour = () => {
    if (editMode) return
    gotoStep(0)
  }

  const exitTour = () => {
    setTourIndex(null)
    goCenter()
  }

  const saveLayout = () => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
    setDirty(false)
    showToast('布放已保存，观众端已生效')
  }

  const exitEdit = () => {
    if (dirty && !window.confirm('有未保存的布放调整，确定退出？')) return
    setEditMode(false)
    setEditSelected(null)
    setLibraryOpen(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  if (!WEBGL_OK) {
    return (
      <div className="errpage">
        <h2>当前浏览器未能启动三维显示</h2>
        <p>请使用新版 Chrome 或 Edge 打开，并确认硬件加速已开启。</p>
        <button className="btn-primary" onClick={() => location.reload()}>重新加载</button>
      </div>
    )
  }

  return (
    <div className="app">
      <Canvas flat shadows camera={{ fov: 78, position: START }} dpr={[1, window.innerWidth < 820 ? 1.5 : 2]} gl={{ antialias: true }}>
        {catalog && (
          <Experience
            items={viewItems}
            fly={fly}
            playing={playing}
            onPick={(item) => setSelected(item)}
            onFlyDone={() => setFly(null)}
            editMode={editMode}
            selectedId={editSelected}
            layout={layout}
            onSelect={setEditSelected}
            onMoved={(id, p) => {
              setLayout((prev) => ({ ...prev, [id]: p }))
              setDirty(true)
            }}
            ref={expRef}
          />
        )}
      </Canvas>

      {catalog && (
        <Hud
          items={viewItems}
          activeId={selected?.id}
          onPick={editMode ? (item) => setEditSelected(item.id) : focus}
          guide={guide}
          onDismissGuide={() => {
            setGuide(false)
            localStorage.setItem('lm-guide', '1')
          }}
          onHelp={() => setGuide(true)}
          onAdmin={() => (editMode ? exitEdit() : setAdminOpen(true))}
          onTour={startTour}
          onCenter={goCenter}
          drawerOpen={!!selected || editMode}
        />
      )}

      {selected && <div className="scrim" />}

      {selected && (
        <DetailDrawer
          item={selected}
          playing={playing === selected.id}
          onTogglePlay={() => setPlaying((p) => (p === selected.id ? null : selected.id))}
          onClose={() => {
            setSelected(null)
            setPlaying(null)
          }}
        />
      )}

      {adminOpen && (
        <AdminLogin
          onClose={() => setAdminOpen(false)}
          onSuccess={() => {
            setAdminOpen(false)
            setEditMode(true)
            setSelected(null)
            setPlaying(null)
            showToast('已进入布放编辑模式')
          }}
        />
      )}

      {tourIndex !== null && tour[tourIndex] && (
        <TourBar
          index={tourIndex}
          total={tour.length}
          title={tour[tourIndex].title}
          caption={tour[tourIndex].caption}
          onPrev={() => gotoStep(tourIndex - 1)}
          onNext={() => (tourIndex === tour.length - 1 ? exitTour() : gotoStep(tourIndex + 1))}
          onExit={exitTour}
        />
      )}

      {editMode && (
        <EditBar
          selectedName={catalog?.items.find((i) => i.id === editSelected)?.name ?? null}
          dirty={dirty}
          libraryOpen={libraryOpen}
          onRotate={(deg) => expRef.current?.rotate(deg)}
          onToggleLibrary={() => setLibraryOpen((v) => !v)}
          onSave={saveLayout}
          onExit={exitEdit}
        />
      )}

      {editMode && libraryOpen && catalog && (
        <LibraryPanel
          items={catalog.items}
          placed={placedMap}
          selectedId={editSelected}
          onPick={(item) => setEditSelected(item.id)}
          onPlace={placeItem}
          onRemove={removeItem}
          onClose={() => setLibraryOpen(false)}
        />
      )}

      {loading && <Loading />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
