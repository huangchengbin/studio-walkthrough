import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import Experience, { type EditApi, type Placement } from './scene/Experience'
import Hud from './components/Hud'
import DetailDrawer from './components/DetailDrawer'
import Loading from './components/Loading'
import AdminLogin from './components/AdminLogin'
import EditBar from './components/EditBar'
import LibraryPanel from './components/LibraryPanel'
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
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

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
      <Canvas flat shadows camera={{ fov: 78, position: START }} dpr={[1, 2]} gl={{ antialias: true }}>
        {catalog && (
          <Experience
            items={catalog.items}
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
          items={catalog.items}
          activeId={selected?.id}
          onPick={editMode ? (item) => setEditSelected(item.id) : focus}
          guide={guide}
          onDismissGuide={() => {
            setGuide(false)
            localStorage.setItem('lm-guide', '1')
          }}
          onHelp={() => setGuide(true)}
          onAdmin={() => (editMode ? exitEdit() : setAdminOpen(true))}
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
          selectedId={editSelected}
          onPick={(item) => setEditSelected(item.id)}
          onClose={() => setLibraryOpen(false)}
        />
      )}

      {loading && <Loading />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
