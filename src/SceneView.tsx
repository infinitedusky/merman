import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Line, Text } from '@react-three/drei'
import type { Box, LayoutResult, Route } from './model'
import { reroute } from './layout'
import { cam, focusOn, fitH, type Mode } from './camera'
import { SeqScene } from './SeqScene'
import type { SeqLayout } from './seq'
import { NodeBody, Tray, S, TRAY, NODE_H, baseOf, type LabelMode } from './shapes'

type Ovr = Record<string, { x: number; y: number }>

function effective(data: LayoutResult, ovr: Ovr) {
  const boxes = new Map<string, Box>()
  for (const b of data.boxes) boxes.set(b.id, ovr[b.id] ? { ...b, ...ovr[b.id] } : b)
  const routes: Route[] = data.routes.map(r =>
    ovr[r.from] || ovr[r.to] ? { ...r, points: reroute(boxes.get(r.from)!, boxes.get(r.to)!) } : r)
  return { boxes, routes }
}

function Rig({ fpsRef }: { fpsRef: React.RefObject<HTMLDivElement> }) {
  const acc = useRef({ t: 0, n: 0 })
  useFrame(({ camera, size }, dt) => {
    cam.aspect = size.width / size.height
    const c = cam.cur, g = cam.goal, k = 1 - Math.exp(-6 * Math.min(dt, 0.1))
    for (const key of ['tx', 'tz', 'yaw', 'pitch'] as const) c[key] += (g[key] - c[key]) * k
    for (const key of ['H', 'fov'] as const) c[key] = Math.exp(Math.log(c[key]) + (Math.log(g[key]) - Math.log(c[key])) * k)
    const p = camera as THREE.PerspectiveCamera
    const d = c.H / 2 / Math.tan((c.fov * Math.PI) / 360)
    p.fov = c.fov
    p.near = Math.max(0.1, d - 120); p.far = d + 120
    p.position.set(c.tx + d * Math.sin(c.yaw) * Math.cos(c.pitch), d * Math.sin(c.pitch), c.tz + d * Math.cos(c.yaw) * Math.cos(c.pitch))
    p.lookAt(c.tx, 0, c.tz)
    p.updateProjectionMatrix()
    acc.current.t += dt; acc.current.n++
    if (acc.current.t > 0.5 && fpsRef.current) {
      fpsRef.current.textContent = `${Math.round(acc.current.n / acc.current.t)} fps`
      acc.current = { t: 0, n: 0 }
    }
  })
  return null
}

function Edge({ r, boxes, labelMode }: { r: Route; boxes: Map<string, Box>; labelMode: LabelMode }) {
  const a = boxes.get(r.from)!, b = boxes.get(r.to)!
  const y = Math.max(baseOf(a) + (a.kind === 'group' ? TRAY : 0), baseOf(b) + (b.kind === 'group' ? TRAY : 0)) + 0.06
  const pts = r.points
  const v = useMemo(() => pts.map(([x, z]) => new THREE.Vector3(x, y, z)), [pts, y])
  const n = v.length
  const dir = new THREE.Vector3().subVectors(v[n - 1], v[n - 2]).normalize()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  const tip = v[n - 1].clone().multiplyScalar(0).add(v[n - 1])
  const line = [...v.slice(0, n - 1), tip.clone().addScaledVector(dir, -0.3)]
  // label on the longest segment
  let best = 0, bi = 0
  for (let i = 0; i < n - 1; i++) { const l = v[i].distanceTo(v[i + 1]); if (l > best) { best = l; bi = i } }
  const mid = v[bi].clone().add(v[bi + 1]).multiplyScalar(0.5)
  return (
    <group>
      <Line points={line.map(p => p.toArray() as [number, number, number])} color="#e8edf7" lineWidth={2} />
      <mesh position={tip.clone().addScaledVector(dir, -0.2)} quaternion={quat}>
        <coneGeometry args={[0.13, 0.4, 16]} />
        <meshBasicMaterial color="#e8edf7" />
      </mesh>
      {r.label && (
        <Text position={[mid.x, y + (labelMode === 'top' ? 0.02 : 0.4), mid.z]} rotation={labelMode === 'top' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} fontSize={0.22} color="#ffd479" outlineWidth={0.02} outlineColor="#000">{r.label}</Text>
      )}
    </group>
  )
}

function Env({ children, wheelZoom = true }: { children: React.ReactNode; wheelZoom?: boolean }) {
  const { gl } = useThree()
  const startCamDrag = (e: ThreeEvent<PointerEvent>) => {
    let lx = e.nativeEvent.clientX, ly = e.nativeEvent.clientY
    const orbit = cam.mode === '3d' && e.nativeEvent.button === 0
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - lx, dy = ev.clientY - ly
      lx = ev.clientX; ly = ev.clientY
      const g = cam.goal, c = cam.cur
      if (orbit) {
        g.yaw -= dx * 0.005; g.pitch = Math.min(1.5, Math.max(0.15, g.pitch + dy * 0.005))
      } else {
        const upp = c.H / gl.domElement.clientHeight
        const sy = Math.sin(c.yaw), cy = Math.cos(c.yaw)
        const mx = -dx * upp * cy + dy * upp * (-sy) / Math.sin(c.pitch)
        const mz = dx * upp * sy + dy * upp * (-cy) / Math.sin(c.pitch)
        g.tx += mx; g.tz += mz; c.tx += mx; c.tz += mz
      }
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  useEffect(() => {
    const el = gl.domElement
    // wheelZoom=false: leave the event alone so an embedding page scrolls over the scene
    const wheel = (e: WheelEvent) => { if (!wheelZoom) return; e.preventDefault(); cam.goal.H = Math.min(200, Math.max(3, cam.goal.H * Math.exp(e.deltaY * 0.001))) }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [gl, wheelZoom])


  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#bcd0ff', '#202838', 0.5]} />
      <directionalLight position={[10, 18, 7]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-near={1} shadow-camera-far={80} shadow-bias={-0.0004} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} onPointerDown={startCamDrag} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0f1218" roughness={1} />
      </mesh>
      <gridHelper args={[200, 200, '#1d2433', '#161c28']} position={[0, -0.01, 0]} />
      {children}
    </>
  )
}

function Scene({ data, labelMode, onDrill, wheelZoom }: { data: LayoutResult; labelMode: LabelMode; onDrill: (cx: number, cz: number, X: number, Z: number) => void; wheelZoom: boolean }) {
  const { camera, gl, raycaster } = useThree()
  const [ver, setVer] = useState(0)
  const ovr = useRef<Ovr>({})
  const [hover, setHover] = useState<string | null>(null)
  useEffect(() => { ovr.current = {}; setVer(v => v + 1) }, [data])
  const { boxes, routes } = useMemo(() => effective(data, ovr.current), [data, ver])
  const W = data.width, H = data.height
  const wx = (x: number) => (x - W / 2) * S, wz = (y: number) => (y - H / 2) * S

  const groundPoint = (cx: number, cy: number, planeY: number) => {
    const r = gl.domElement.getBoundingClientRect()
    raycaster.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera)
    const out = new THREE.Vector3()
    return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), out) ? out : null
  }

  const startNodeDrag = (e: ThreeEvent<PointerEvent>, id: string) => {
    e.stopPropagation()
    const b = boxes.get(id)!
    const planeY = baseOf(b) + NODE_H
    const p0 = groundPoint(e.nativeEvent.clientX, e.nativeEvent.clientY, planeY)
    if (!p0) return
    const gx = p0.x / S + W / 2 - b.x, gy = p0.z / S + H / 2 - b.y
    const parent = b.parent ? data.boxes.find(x => x.id === b.parent) : undefined
    document.body.style.cursor = 'grabbing'
    const move = (ev: PointerEvent) => {
      const p = groundPoint(ev.clientX, ev.clientY, planeY)
      if (!p) return
      let x = p.x / S + W / 2 - gx, y = p.z / S + H / 2 - gy
      if (parent) { // keep inside parent tray
        x = Math.min(Math.max(x, parent.x + 10), parent.x + parent.w - b.w - 10)
        y = Math.min(Math.max(y, parent.y + 40), parent.y + parent.h - b.h - 10)
      }
      ovr.current = { ...ovr.current, [id]: { x, y } }
      setVer(v => v + 1)
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); document.body.style.cursor = '' }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  return (
    <>
      <Env wheelZoom={wheelZoom}>
      {[...boxes.values()].map(b => {
        const w = b.w * S, h = b.h * S
        const pos: [number, number, number] = [wx(b.x) + w / 2, baseOf(b), wz(b.y) + h / 2]
        if (b.kind === 'group') {
          return (
            <group key={b.id} position={pos}
              onClick={e => { if (e.delta < 4) { e.stopPropagation(); onDrill(pos[0], pos[2], w, h) } }}
              onPointerOver={e => { e.stopPropagation(); setHover(b.id); document.body.style.cursor = 'zoom-in' }}
              onPointerOut={() => { setHover(null); document.body.style.cursor = '' }}>
              <Tray b={b} labelMode={labelMode} hover={hover === b.id} />
            </group>
          )
        }
        return <NodeLift key={b.id} pos={pos} hover={hover === b.id}
          onDown={e => startNodeDrag(e, b.id)}
          onOver={() => { setHover(b.id); document.body.style.cursor = 'grab' }}
          onOut={() => { setHover(null); document.body.style.cursor = '' }}>
          <NodeBody b={b} hover={hover === b.id} labelMode={labelMode} />
        </NodeLift>
      })}
      {routes.map(r => (boxes.get(r.from) && boxes.get(r.to)) ? <Edge key={r.id} r={{ ...r, points: r.points.map(([x, y]) => [wx(x), wz(y)] as [number, number]) }} boxes={boxes} labelMode={labelMode} /> : null)}
      </Env>
    </>
  )
}

function NodeLift({ pos, hover, children, onDown, onOver, onOut }: { pos: [number, number, number]; hover: boolean; children: React.ReactNode; onDown: (e: ThreeEvent<PointerEvent>) => void; onOver: () => void; onOut: () => void }) {
  const ref = useRef<THREE.Group>(null!)
  const lift = useRef(0)
  useFrame((_, dt) => {
    lift.current += ((hover ? 0.18 : 0) - lift.current) * (1 - Math.exp(-14 * dt))
    ref.current.position.set(pos[0], pos[1] + lift.current, pos[2])
  })
  return (
    <group ref={ref} onPointerDown={onDown} onPointerOver={e => { e.stopPropagation(); onOver() }} onPointerOut={onOut}>
      {children}
    </group>
  )
}

export function SceneView({ data, labelMode, mode, showFps = true, wheelZoom = true }: {
  data: LayoutResult | SeqLayout | null; labelMode: LabelMode; mode: Mode
  /** Show the fps counter bottom-right. Default true. */
  showFps?: boolean
  /** Zoom on mouse wheel (and stop page scroll). False lets the page scroll over the scene. Default true. */
  wheelZoom?: boolean
}) {
  const fpsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!data) return
    focusOn(0, 0, data.width * S, data.height * S)
  }, [data])
  void mode; void fitH
  return (
    <>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 1, near: 1, far: 5000, position: [0, 100, 0] }} gl={{ antialias: true }}>
        <color attach="background" args={['#0f1218']} />
        <Rig fpsRef={fpsRef} />
        {data && ('kind' in data ? <Env wheelZoom={wheelZoom}><SeqScene data={data} labelMode={labelMode} /></Env> : <Scene data={data} labelMode={labelMode} onDrill={focusOn} wheelZoom={wheelZoom} />)}
      </Canvas>
      {showFps && <div ref={fpsRef} style={{ position: 'absolute', right: 12, bottom: 10, color: '#7f8aa3', font: '12px monospace' }} />}
    </>
  )
}
