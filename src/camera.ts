export type Mode = 'flat' | 'iso' | '3d'
const D = Math.PI / 180
// One perspective camera for every view. "Flat" and "iso" use a ~1deg fov (visually orthographic,
// distance is compensated so the framing is identical); 3D opens the fov. Animating fov while
// holding the framing at the target = dolly-zoom, which gives a continuous ortho <-> perspective morph.
export const PRESET = {
  flat: { yaw: 0, pitch: 89.9 * D, fov: 1 },
  iso: { yaw: 45 * D, pitch: Math.atan(1 / Math.SQRT2), fov: 1 },
  '3d': { yaw: 25 * D, pitch: 38 * D, fov: 45 },
}
interface Pose { tx: number; tz: number; H: number; yaw: number; pitch: number; fov: number }
export const cam = {
  mode: 'iso' as Mode,
  goal: { tx: 0, tz: 0, H: 30, ...PRESET.iso } as Pose,
  cur: { tx: 0, tz: 0, H: 30, ...PRESET.iso } as Pose,
  focus: { cx: 0, cz: 0, X: 20, Z: 20 },
  aspect: 1.6,
}
export function fitH(mode: Mode) {
  const { X, Z } = cam.focus
  if (mode === 'flat') return Math.max(Z, X / cam.aspect) * 1.12
  const diag = Math.hypot(X, Z)
  return Math.max(diag * Math.sin(PRESET[mode].pitch) + 2, (diag / cam.aspect) * 0.8) * (mode === '3d' ? 1.15 : 0.95)
}
export function setMode(m: Mode) {
  cam.mode = m
  Object.assign(cam.goal, PRESET[m])
  cam.goal.H = fitH(m)
}
export function focusOn(cx: number, cz: number, X: number, Z: number) {
  cam.focus = { cx, cz, X, Z }
  cam.goal.tx = cx; cam.goal.tz = cz; cam.goal.H = fitH(cam.mode)
}
