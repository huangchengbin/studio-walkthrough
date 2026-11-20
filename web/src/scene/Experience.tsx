import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import WalkControls from './WalkControls'
import { editBus } from './editBus'
import type { CatalogItem } from '../data/types'
import type { FlyTarget } from '../App'

export interface Placement {
  x: number
  z: number
  rotY: number
}

export interface EditApi {
  rotate: (deg: number) => void
}

interface Props {
  items: CatalogItem[]
  fly: FlyTarget | null
  playing: string | null
  onPick: (item: CatalogItem) => void
  onFlyDone: () => void
  editMode?: boolean
  selectedId?: string | null
  layout?: Record<string, Placement>
  onSelect?: (id: string | null) => void
  onMoved?: (id: string, p: Placement) => void
}

function Hotspot({ item, index, onPick }: { item: CatalogItem; index: number; onPick: () => void }) {
  return (
    <Html position={[item.world[0], item.top + 0.16, item.world[2]]} center distanceFactor={10} zIndexRange={[6, 0]} className="hotspot-wrap">
      <div className="hotspot" onClick={(e) => { e.stopPropagation(); onPick() }}>
        {String(index + 1).padStart(2, '0')}
        <div className="tip">
          <strong>{item.name}</strong>
          <span>点击查看详情</span>
        </div>
      </div>
    </Html>
  )
}

interface AnimState {
  group: THREE.Object3D
  baseY: number
  baseRotY: number
  kids: { obj: THREE.Object3D; baseX: number }[]
  t: number
}

const Experience = forwardRef<EditApi, Props>(function Experience(
  { items, fly, playing, onPick, onFlyDone, editMode = false, selectedId = null, layout = {}, onSelect, onMoved },
  ref,
) {
  const { scene } = useGLTF('/assets/scene.glb')
  const { camera, gl } = useThree()
  const dir = useRef<THREE.DirectionalLight>(null)
  const [dragging, setDragging] = useState(false)
  const boxRef = useRef<THREE.BoxHelper | null>(null)
  const obstacles = useMemo(
    () => [
      { x: 0.87, z: -0.45, r: 0.85 },
      { x: 2.38, z: -0.45, r: 0.85 },
      { x: 3.89, z: -0.45, r: 0.85 },
      { x: 5.4, z: -0.45, r: 0.85 },
      { x: 3.3, z: -3.5, r: 1.45 },
      { x: 6.1, z: -5.65, r: 1.15 },
      { x: 8.7, z: -4.25, r: 1.3 },
      { x: 9.65, z: -2.4, r: 1.35 },
    ],
    [],
  )

  useEffect(() => {
    const l = dir.current
    if (!l) return
    l.target.position.set(3.75, 0, -4.2)
    l.target.updateMatrixWorld()
    const c = l.shadow.camera
    c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 30
    c.updateProjectionMatrix()
  }, [])

  useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 0.6
      }
    })
  }, [scene])

  // ---------- 演示动画 ----------
  const anim = useRef<AnimState | null>(null)

  useEffect(() => {
    const prev = anim.current
    if (prev) {
      prev.group.rotation.y = prev.baseRotY
      prev.group.position.y = prev.baseY
      prev.kids.forEach((k) => { k.obj.position.x = k.baseX })
      anim.current = null
    }
    if (!playing || editMode) return
    const g = scene.getObjectByName(`place-${playing}`)
    if (!g) return
    anim.current = {
      group: g,
      baseY: g.position.y,
      baseRotY: g.rotation.y,
      kids: g.children.map((o) => ({ obj: o, baseX: o.position.x })),
      t: 0,
    }
  }, [playing, scene, editMode])

  useFrame((_, dt) => {
    const a = anim.current
    if (a) {
      a.t += dt
      a.group.rotation.y = a.baseRotY + a.t * 0.85
      a.group.position.y = a.baseY + Math.sin(a.t * 1.8) * 0.03
      a.kids.forEach((k, i) => {
        k.obj.position.x = k.baseX + Math.sin(a.t * 2 + i) * 0.022
      })
    }
    if (boxRef.current && selectedId && editMode) {
      const g = scene.getObjectByName(`place-${selectedId}`)
      if (g) boxRef.current.setFromObject(g)
    }
  })

  // ---------- 布放：应用已保存布局 ----------
  useEffect(() => {
    Object.entries(layout).forEach(([id, p]) => {
      const g = scene.getObjectByName(`place-${id}`)
      if (!g) return
      g.position.x = p.x
      g.position.z = p.z
      g.rotation.y = p.rotY
    })
  }, [layout, scene])

  // ---------- 布放：选中高亮框 ----------
  useEffect(() => {
    if (!editMode) {
      if (boxRef.current) {
        scene.remove(boxRef.current)
        boxRef.current.geometry.dispose()
        boxRef.current = null
      }
      return
    }
    if (!boxRef.current) {
      const box = new THREE.BoxHelper(new THREE.Object3D(), 0x3b82f6)
      box.visible = false
      boxRef.current = box
      scene.add(box)
    }
    if (!selectedId) {
      boxRef.current.visible = false
      return
    }
    const g = scene.getObjectByName(`place-${selectedId}`)
    if (!g) {
      boxRef.current.visible = false
      return
    }
    boxRef.current.visible = true
    boxRef.current.setFromObject(g)
  }, [editMode, selectedId, scene])

  // ---------- 布放：拖拽 ----------
  const findPlace = (obj: THREE.Object3D | null): THREE.Object3D | null => {
    let o: THREE.Object3D | null = obj
    while (o) {
      if (o.name && o.name.startsWith('place-')) return o
      o = o.parent
    }
    return null
  }

  const onPointerDown = (e: any) => {
    if (!editMode) return
    const place = findPlace(e.object)
    if (!place) {
      onSelect?.(null)
      return
    }
    e.stopPropagation()
    editBus.draggingItem = true
    const id = place.name.replace('place-', '')
    onSelect?.(id)

    const ray = new THREE.Raycaster()
    const hit = new THREE.Vector3()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -place.position.y)
    const toNdc = (cx: number, cy: number) => new THREE.Vector2(
      (cx / gl.domElement.clientWidth) * 2 - 1,
      -(cy / gl.domElement.clientHeight) * 2 + 1,
    )
    ray.setFromCamera(toNdc(e.clientX, e.clientY), camera)
    ray.ray.intersectPlane(plane, hit)
    const offsetX = place.position.x - hit.x
    const offsetZ = place.position.z - hit.z

    setDragging(true)
    const dom = gl.domElement
    const move = (ev: PointerEvent) => {
      ray.setFromCamera(toNdc(ev.clientX, ev.clientY), camera)
      if (ray.ray.intersectPlane(plane, hit)) {
        place.position.x = THREE.MathUtils.clamp(hit.x + offsetX, 0.3, 11.0)
        place.position.z = THREE.MathUtils.clamp(hit.z + offsetZ, -8.0, -0.3)
      }
    }
    const up = () => {
      editBus.draggingItem = false
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      onMoved?.(id, { x: place.position.x, z: place.position.z, rotY: place.rotation.y })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  useImperativeHandle(ref, () => ({
    rotate(deg: number) {
      if (!selectedId) return
      const g = scene.getObjectByName(`place-${selectedId}`)
      if (!g) return
      g.rotation.y += (deg * Math.PI) / 180
      onMoved?.(selectedId, { x: g.position.x, z: g.position.z, rotY: g.rotation.y })
    },
  }), [scene, selectedId, onMoved])

  return (
    <>
      <color attach="background" args={['#F2F5F9']} />
      <fog attach="fog" args={['#F5F8FB', 30, 60]} />
      <ambientLight intensity={2.85} color="#FFFFFF" />
      <hemisphereLight args={['#FFFFFF', '#D8DDE3', 0.55]} />
      <directionalLight
        ref={dir}
        position={[7.5, 16, -1.5]}
        intensity={0.7}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 7, -7]} intensity={0.25} color="#F6F9FF" />
      <Suspense fallback={null}>
        <primitive object={scene} onPointerDown={onPointerDown} />
      </Suspense>
      {!editMode && items.map((item, i) => (
        <Hotspot key={item.uid} item={item} index={i} onPick={() => onPick(item)} />
      ))}
      <WalkControls fly={fly} obstacles={obstacles} onFlyDone={onFlyDone} lookEnabled={!dragging} />
    </>
  )
})

export default Experience
