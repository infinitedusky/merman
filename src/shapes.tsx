import * as THREE from 'three'
import { useMemo } from 'react'
import { Text, Billboard } from '@react-three/drei'
import type { Box } from './model'

export const S = 1 / 40 // px -> world
export const TRAY = 0.25 // tray thickness (one level)
export const NODE_H = 0.7

const COLORS: Record<string, string> = { rect: '#5b8def', round: '#3fbf9b', cylinder: '#e0a458', diamond: '#d96c8a' }
export const trayColor = (level: number) => ['#243044', '#2d3b52', '#374862'][Math.min(level, 2)]

function rounded(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}
function geometry(shape: Box['shape'], w: number, h: number) {
  let g: THREE.BufferGeometry
  if (shape === 'cylinder') {
    g = new THREE.CylinderGeometry(0.5, 0.5, 1, 48).translate(0, 0.5, 0).scale(w, NODE_H, h)
    return g
  }
  let sh: THREE.Shape
  if (shape === 'diamond') {
    sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(0, -h / 2); sh.lineTo(w / 2, 0); sh.lineTo(0, h / 2); sh.closePath()
  } else sh = rounded(w, h, shape === 'round' ? Math.min(w, h) / 2 * 0.95 : 0.12)
  g = new THREE.ExtrudeGeometry(sh, { depth: NODE_H, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 16 })
  g.rotateX(-Math.PI / 2)
  return g
}

export type LabelMode = 'top' | 'billboard'

export function NodeBody({ b, hover = false, labelMode }: { b: Box; hover?: boolean; labelMode: LabelMode }) {
  const w = b.w * S, h = b.h * S
  const geo = useMemo(() => geometry(b.shape, w, h), [b.shape, w, h])
  return (
    <>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS[b.shape]} roughness={0.5} metalness={0.05} emissive={hover ? '#ffffff' : '#000000'} emissiveIntensity={hover ? 0.18 : 0} />
      </mesh>
      <Label text={b.label} mode={labelMode} y={NODE_H + 0.08} size={0.36} maxWidth={w - 0.3} />
    </>
  )
}

export function Label({ text, mode, y, size, maxWidth, left = false, color = '#fff' }: { text: string; mode: LabelMode; y: number; size: number; maxWidth: number; left?: boolean; color?: string }) {
  const common = { fontSize: size, maxWidth, color, anchorX: left ? ('left' as const) : ('center' as const), anchorY: 'middle' as const, textAlign: left ? ('left' as const) : ('center' as const) }
  if (mode === 'top') return <Text {...common} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>{text}</Text>
  return (
    <Billboard position={[0, y + 0.45, 0]}>
      <Text {...common} outlineWidth={0.03} outlineColor="#000">{text}</Text>
    </Billboard>
  )
}

export function Tray({ b, labelMode, hover = false }: { b: Box; labelMode: LabelMode; hover?: boolean }) {
  const w = b.w * S, h = b.h * S
  return (
    <>
      <mesh position={[0, TRAY / 2, 0]} receiveShadow>
        <boxGeometry args={[w, TRAY, h]} />
        <meshStandardMaterial color={trayColor(b.level)} roughness={0.9} emissive={hover ? '#8fb0ff' : '#000'} emissiveIntensity={hover ? 0.15 : 0} />
      </mesh>
      <group position={[-w / 2 + 0.25, 0, -h / 2 + 0.5]}>
        <Label text={b.label} mode={labelMode} y={TRAY + 0.01} size={0.4} maxWidth={w - 0.5} left color="#cfd8ea" />
      </group>
    </>
  )
}

// y of the surface a box sits on
export const baseOf = (b: Box) => (b.kind === 'group' ? b.level * TRAY : b.level * TRAY)
