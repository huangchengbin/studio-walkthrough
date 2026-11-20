import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlyTarget } from '../App'

interface Obstacle { x: number; z: number; r: number }

const EYE = 1.66
const SPEED = 1.55
const BOUND = { xMin: 0.35, xMax: 10.95, zMin: -8.05, zMax: -0.35 }

export default function WalkControls({
  fly,
  obstacles,
  onFlyDone,
}: {
  fly: FlyTarget | null
  obstacles: Obstacle[]
  onFlyDone: () => void
}) {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const yaw = useRef(0)
  const pitch = useRef(0)
  const dragging = useRef(false)
  const last = useRef<[number, number]>([0, 0])
  const flyRef = useRef<FlyTarget | null>(null)
  const flyKey = useRef<number>(0)
  const obstaclesRef = useRef(obstacles)
  obstaclesRef.current = obstacles

  useEffect(() => {
    const dom = gl.domElement
    const down = (e: PointerEvent) => {
      dragging.current = true
      last.current = [e.clientX, e.clientY]
      dom.setPointerCapture(e.pointerId)
    }
    const up = () => { dragging.current = false }
    const move = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - last.current[0]
      const dy = e.clientY - last.current[1]
      last.current = [e.clientX, e.clientY]
      yaw.current -= dx * 0.0042
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0036, -1.32, 1.32)
    }
    let lastWheel = 0
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = performance.now()
      if (now - lastWheel < 70) return
      lastWheel = now
      const cam = camera as THREE.PerspectiveCamera
      cam.fov = THREE.MathUtils.clamp(cam.fov + Math.sign(e.deltaY) * 5, 40, 92)
      cam.updateProjectionMatrix()
    }
    const keyHandler = (v: boolean) => (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      keys.current[k] = v
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault()
    }
    const kd = keyHandler(true)
    const ku = keyHandler(false)
    dom.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointermove', move)
    dom.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      dom.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointermove', move)
      dom.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [camera, gl])

  useEffect(() => {
    if (fly) {
      flyRef.current = fly
      flyKey.current = fly.key
    }
  }, [fly])

  const canStand = (x: number, z: number) => {
    if (x < BOUND.xMin || x > BOUND.xMax || z < BOUND.zMin || z > BOUND.zMax) return false
    for (const o of obstaclesRef.current) {
      const dx = x - o.x
      const dz = z - o.z
      if (dx * dx + dz * dz < o.r * o.r) return false
    }
    return true
  }

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const d = Math.min(dt, 0.05)

    const f = flyRef.current
    if (f) {
      const target = new THREE.Vector3(...f.pos)
      const look = new THREE.Vector3(...f.look)
      cam.position.lerp(target, 1 - Math.pow(0.000002, d))
      const dir = look.clone().sub(cam.position)
      const targetYaw = Math.atan2(-dir.x, -dir.z)
      const targetPitch = Math.asin(THREE.MathUtils.clamp(dir.y / (dir.length() || 1), -1, 1))
      let dy = targetYaw - yaw.current
      while (dy > Math.PI) dy -= Math.PI * 2
      while (dy < -Math.PI) dy += Math.PI * 2
      yaw.current += dy * (1 - Math.pow(0.000004, d))
      pitch.current += (targetPitch - pitch.current) * (1 - Math.pow(0.000004, d))
      if (cam.position.distanceTo(target) < 0.08) {
        flyRef.current = null
        onFlyDone()
      }
    } else {
      let fx = 0
      let fz = 0
      if (keys.current['w'] || keys.current['arrowup']) fz += 1
      if (keys.current['s'] || keys.current['arrowdown']) fz -= 1
      if (keys.current['a'] || keys.current['arrowleft']) fx -= 1
      if (keys.current['d'] || keys.current['arrowright']) fx += 1
      if (fx || fz) {
        const len = Math.hypot(fx, fz)
        fx /= len
        fz /= len
        const sin = Math.sin(yaw.current)
        const cos = Math.cos(yaw.current)
        const dx = (-sin * fz + cos * fx) * SPEED * d
        const dz = (-cos * fz - sin * fx) * SPEED * d
        const nx = cam.position.x + dx
        const nz = cam.position.z + dz
        if (canStand(nx, cam.position.z)) cam.position.x = nx
        if (canStand(cam.position.x, nz)) cam.position.z = nz
      }
    }

    cam.position.y = EYE
    cam.rotation.order = 'YXZ'
    cam.rotation.y = yaw.current
    cam.rotation.x = pitch.current
  })

  return null
}
