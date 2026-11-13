import ELK from 'elkjs/lib/elk.bundled.js'
import type { Graph, Box, Route, LayoutResult } from './model'

// Swap-friendly interface: layout(graph) -> { boxes, routes }.
export type LayoutEngine = (g: Graph) => Promise<LayoutResult>

const elk = new ELK()

function sizeOf(n: { label: string; shape: string }) {
  const w = Math.min(220, Math.max(110, n.label.length * 9 + 36))
  if (n.shape === 'diamond') return { w: w + 30, h: 78 }
  if (n.shape === 'cylinder') return { w, h: 64 }
  return { w, h: 56 }
}

export const layout: LayoutEngine = async (g) => {
  const groupIds = new Set(g.groups.map(x => x.id))
  const parentOf = new Map<string, string | undefined>()
  g.groups.forEach(x => parentOf.set(x.id, x.parent))
  g.nodes.forEach(x => parentOf.set(x.id, x.parent))
  const chain = (id: string) => { const c: (string | undefined)[] = [undefined]; const l: string[] = []; for (let p: string | undefined = id; p; p = parentOf.get(p)) l.unshift(p); return c.concat(l) }

  const eNodes = new Map<string, any>()
  for (const grp of g.groups) eNodes.set(grp.id, { id: grp.id, children: [], edges: [], layoutOptions: { 'elk.padding': '[top=46,left=20,bottom=20,right=20]' } })
  for (const n of g.nodes) { const s = sizeOf(n); eNodes.set(n.id, { id: n.id, width: s.w, height: s.h }) }
  const root: any = {
    id: 'root', children: [], edges: [],
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': g.direction === 'LR' ? 'RIGHT' : 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.json.edgeCoords': 'ROOT',
      'elk.spacing.nodeNode': '32',
      'elk.layered.spacing.nodeNodeBetweenLayers': '54',
      'elk.spacing.edgeNode': '20',
      'elk.layered.spacing.edgeNodeBetweenLayers': '20',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.padding': '[top=20,left=20,bottom=20,right=20]',
    },
  }
  const place = (id: string, parent?: string) => ((parent ? eNodes.get(parent) : root).children as any[]).push(eNodes.get(id))
  g.groups.forEach(x => place(x.id, x.parent))
  g.nodes.forEach(x => place(x.id, x.parent))

  for (const e of g.edges) {
    const a = chain(e.from), b = chain(e.to)
    if (a.includes(e.to) || b.includes(e.from)) continue // edge to own ancestor
    let i = 0
    while (a[i + 1] !== undefined && a[i + 1] === b[i + 1]) i++
    const lca = a[i] // container of the edge
    const ee: any = { id: e.id, sources: [e.from], targets: [e.to] }
    if (e.label) ee.labels = [{ text: e.label, width: e.label.length * 7 + 8, height: 16 }]
    ;(lca ? eNodes.get(lca) : root).edges.push(ee)
  }

  const out: any = await elk.layout(root)
  const boxes: Box[] = []
  const walk = (n: any, ox: number, oy: number, level: number, parent?: string) => {
    for (const c of n.children ?? []) {
      const isGroup = groupIds.has(c.id)
      const src = isGroup ? g.groups.find(x => x.id === c.id)! : g.nodes.find(x => x.id === c.id)!
      boxes.push({
        id: c.id, label: src.label, kind: isGroup ? 'group' : 'node',
        shape: isGroup ? 'rect' : (src as any).shape,
        x: ox + c.x, y: oy + c.y, w: c.width, h: c.height, level, parent,
      })
      if (isGroup) walk(c, ox + c.x, oy + c.y, level + 1, c.id)
    }
  }
  walk(out, 0, 0, 0)
  const routes: Route[] = []
  const collect = (n: any, ox: number, oy: number) => {
    for (const e of n.edges ?? []) {
      const s = e.sections?.[0]
      if (!s) continue
      const pts: [number, number][] = [[ox + s.startPoint.x, oy + s.startPoint.y], ...(s.bendPoints ?? []).map((p: any) => [ox + p.x, oy + p.y] as [number, number]), [ox + s.endPoint.x, oy + s.endPoint.y]]
      const src = g.edges.find(x => x.id === e.id)!
      routes.push({ id: e.id, from: src.from, to: src.to, label: src.label, points: pts })
    }
    for (const c of n.children ?? []) collect(c, ox + c.x, oy + c.y)
  }
  collect(out, 0, 0)
  return { boxes, routes, width: out.width, height: out.height }
}

// Cheap Manhattan reroute between two boxes, used while dragging (no ELK round trip).
export function reroute(a: Box, b: Box): [number, number][] {
  const acx = a.x + a.w / 2, acy = a.y + a.h / 2, bcx = b.x + b.w / 2, bcy = b.y + b.h / 2
  const ox0 = Math.max(a.x, b.x), ox1 = Math.min(a.x + a.w, b.x + b.w)
  const oy0 = Math.max(a.y, b.y), oy1 = Math.min(a.y + a.h, b.y + b.h)
  const vertical = Math.abs(bcy - acy) >= Math.abs(bcx - acx)
  if (vertical) {
    const down = bcy > acy
    const y1 = down ? a.y + a.h : a.y, y2 = down ? b.y : b.y + b.h
    if (ox1 - ox0 > 12) { const x = (ox0 + ox1) / 2; return [[x, y1], [x, y2]] }
    const m = (y1 + y2) / 2
    return [[acx, y1], [acx, m], [bcx, m], [bcx, y2]]
  }
  const right = bcx > acx
  const x1 = right ? a.x + a.w : a.x, x2 = right ? b.x : b.x + b.w
  if (oy1 - oy0 > 12) { const y = (oy0 + oy1) / 2; return [[x1, y], [x2, y]] }
  const m = (x1 + x2) / 2
  return [[x1, acy], [m, acy], [m, bcy], [x2, bcy]]
}
