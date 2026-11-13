// Mermaid sequenceDiagram: parse + our own layout (no ELK). Layout plane: x = participants, y = time (down).
export interface SPart { id: string; label: string; actor: boolean }
export type SItem =
  | { t: 'msg'; from: string; to: string; label: string; dashed: boolean; head: 'arrow' | 'cross' | 'open'; actTo: boolean; deactFrom: boolean }
  | { t: 'act'; id: string } | { t: 'deact'; id: string }
  | { t: 'note'; over: string[]; side: 'over' | 'left' | 'right'; text: string }
  | { t: 'open'; kind: string; label: string } | { t: 'else'; label: string } | { t: 'end' }
export interface SeqDoc { parts: SPart[]; items: SItem[] }

export const isSeq = (src: string) => /^\s*sequenceDiagram/m.test(src)

export function parseSeq(src: string): SeqDoc {
  const parts = new Map<string, SPart>(), items: SItem[] = []
  const ensure = (id: string) => { if (!parts.has(id)) parts.set(id, { id, label: id, actor: false }) }
  for (const raw of src.split('\n')) {
    const l = raw.trim()
    if (!l || l.startsWith('%%') || l.startsWith('sequenceDiagram') || l.startsWith('autonumber') || l.startsWith('title')) continue
    let m = l.match(/^(participant|actor)\s+(\w+)(?:\s+as\s+(.+))?$/)
    if (m) { parts.set(m[2], { id: m[2], label: (m[3] ?? m[2]).trim(), actor: m[1] === 'actor' }); continue }
    m = l.match(/^(activate|deactivate)\s+(\w+)/)
    if (m) { ensure(m[2]); items.push({ t: m[1] === 'activate' ? 'act' : 'deact', id: m[2] }); continue }
    m = l.match(/^(loop|alt|opt|par|critical|break|rect)\b\s*(.*)$/)
    if (m) { items.push({ t: 'open', kind: m[1], label: m[2] }); continue }
    m = l.match(/^(else|and|option)\b\s*(.*)$/)
    if (m) { items.push({ t: 'else', label: m[2] }); continue }
    if (l === 'end') { items.push({ t: 'end' }); continue }
    m = l.match(/^Note\s+(over|left of|right of)\s+([\w,\s]+?)\s*:\s*(.*)$/i)
    if (m) {
      const ids = m[2].split(',').map(x => x.trim()); ids.forEach(ensure)
      items.push({ t: 'note', over: ids, side: m[1].startsWith('over') ? 'over' : m[1].startsWith('left') ? 'left' : 'right', text: m[3] }); continue
    }
    m = l.match(/^(\w+)\s*(-->>|->>|--x|-x|-->|->|--\)|-\))\s*([+-]?)(\w+)\s*:\s*(.*)$/)
    if (m) {
      ensure(m[1]); ensure(m[4])
      const a = m[2]
      items.push({ t: 'msg', from: m[1], to: m[4], label: m[5], dashed: a.startsWith('--'),
        head: a.endsWith('x') ? 'cross' : a.endsWith('>') && !a.endsWith('>>') ? 'open' : 'arrow', actTo: m[3] === '+', deactFrom: m[3] === '-' })
    }
  }
  return { parts: [...parts.values()], items }
}

export interface SeqLayout {
  kind: 'seq'; width: number; height: number
  parts: { id: string; label: string; actor: boolean; x: number; y: number; w: number; h: number; cx: number }[]
  lifeEnd: number
  msgs: { pts: [number, number][]; label: string; dashed: boolean; head: 'arrow' | 'cross' | 'open'; lx: number; ly: number }[]
  acts: { cx: number; y0: number; y1: number; depth: number }[]
  blocks: { kind: string; label: string; x0: number; x1: number; y0: number; y1: number; level: number; divs: { y: number; label: string }[] }[]
  notes: { x: number; y: number; w: number; h: number; text: string }[]
}

export function layoutSeq(doc: SeqDoc): SeqLayout {
  const COL = 190, ROW = 46, TOP = 20, BOXH = 52
  const idx = new Map(doc.parts.map((p, i) => [p.id, i]))
  const cx = (id: string) => 100 + idx.get(id)! * COL
  const out: SeqLayout = { kind: 'seq', width: 200 + (doc.parts.length - 1) * COL, height: 0, parts: [], lifeEnd: 0, msgs: [], acts: [], blocks: [], notes: [] }
  doc.parts.forEach(p => out.parts.push({ ...p, cx: cx(p.id), w: Math.min(170, Math.max(110, p.label.length * 9 + 30)), h: BOXH, x: 0, y: TOP }))
  out.parts.forEach(p => { p.x = p.cx - p.w / 2 })
  let y = TOP + BOXH + 40
  const open = new Map<string, { y0: number }[]>() // active stack per participant
  const stack: { kind: string; label: string; y0: number; lo: number; hi: number; divs: { y: number; label: string }[] }[] = []
  const depthOf = (id: string) => open.get(id)?.length ?? 0
  const touch = (i: number) => stack.forEach(b => { b.lo = Math.min(b.lo, i); b.hi = Math.max(b.hi, i) })
  const activate = (id: string, yy: number) => { const s = open.get(id) ?? []; s.push({ y0: yy }); open.set(id, s) }
  const deactivate = (id: string, yy: number) => {
    const s = open.get(id); const a = s?.pop(); if (a) out.acts.push({ cx: cx(id), y0: a.y0, y1: yy, depth: s!.length })
  }
  for (const it of doc.items) {
    if (it.t === 'msg') {
      y += ROW * (it.from === it.to ? 1.4 : 1)
      const i = idx.get(it.from)!, j = idx.get(it.to)!
      touch(i); touch(j)
      if (it.actTo) activate(it.to, y)
      const off = (id: string) => depthOf(id) * 6
      let pts: [number, number][], lx: number
      if (i === j) { const x = cx(it.from) + off(it.from); pts = [[x, y - 18], [x + 40, y - 18], [x + 40, y], [x, y]]; lx = x + 46 }
      else {
        const dir = Math.sign(j - i)
        pts = [[cx(it.from) + dir * (off(it.from) + (depthOf(it.from) ? 6 : 0)), y], [cx(it.to) - dir * (off(it.to) + (depthOf(it.to) ? 6 : 0)), y]]
        lx = (pts[0][0] + pts[1][0]) / 2
      }
      out.msgs.push({ pts, label: it.label, dashed: it.dashed, head: it.head, lx, ly: y - 14 })
      if (it.deactFrom) deactivate(it.from, y)
    } else if (it.t === 'act') activate(it.id, y)
    else if (it.t === 'deact') deactivate(it.id, y)
    else if (it.t === 'note') {
      y += ROW * 1.2
      const ids = it.over.map(i => idx.get(i)!); ids.forEach(touch)
      const lo = Math.min(...ids), hi = Math.max(...ids)
      const w = Math.max(150, it.text.length * 7 + 20)
      let x: number
      if (it.side === 'over') x = (cx(it.over[0]) + cx(it.over[it.over.length - 1])) / 2 - Math.max(w, (hi - lo) * COL) / 2
      else if (it.side === 'left') x = cx(it.over[0]) - 20 - w
      else x = cx(it.over[0]) + 20
      out.notes.push({ x, y: y - 20, w: it.side === 'over' ? Math.max(w, (hi - lo) * COL) : w, h: 34, text: it.text })
    } else if (it.t === 'open') {
      y += ROW * 0.9
      stack.push({ kind: it.kind, label: it.label, y0: y - 26, lo: 1e9, hi: -1e9, divs: [] })
    } else if (it.t === 'else') {
      y += ROW * 0.7
      stack[stack.length - 1]?.divs.push({ y: y - 22, label: it.label })
    } else if (it.t === 'end') {
      const b = stack.pop(); if (!b) continue
      y += ROW * 0.4
      const n = doc.parts.length - 1
      const lo = b.hi < 0 ? 0 : b.lo, hi = b.hi < 0 ? n : b.hi
      out.blocks.push({ kind: b.kind, label: b.label, x0: cx(out.parts[lo].id) - 70, x1: cx(out.parts[hi].id) + 70, y0: b.y0, y1: y - 10, level: stack.length, divs: b.divs })
    }
  }
  for (const [id, s] of open) while (s.length) deactivate(id, y)
  y += 50
  out.lifeEnd = y; out.height = y + 20
  out.width = Math.max(out.width, ...out.blocks.map(b => b.x1 + 40), ...out.notes.map(n => n.x + n.w + 20))
  const minX = Math.min(0, ...out.notes.map(n => n.x - 20), ...out.blocks.map(b => b.x0 - 20))
  if (minX < 0) { // shift everything right
    const d = -minX
    out.parts.forEach(p => { p.x += d; p.cx += d }); out.msgs.forEach(m => { m.pts.forEach(p => p[0] += d); m.lx += d })
    out.acts.forEach(a => a.cx += d); out.blocks.forEach(b => { b.x0 += d; b.x1 += d }); out.notes.forEach(n => n.x += d); out.width += d
  }
  return out
}
