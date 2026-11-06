/**
 * Minimal SVG → Rive RML converter for our own, hand-written character art. Supports what the
 * art uses: <g> style inheritance, <path> (M L H V C Q T Z, absolute and relative), <rect>
 * (rx, rotate transform), <circle>, <ellipse>, fill, stroke (width, cap, join, dasharray) and
 * opacity. Not a general SVG importer.
 *
 * Draw order: SVG paints later elements on top; Rive paints the FIRST sibling on top, so shapes
 * are emitted in reverse. Inside a shape, Fill comes before Stroke (later paint draws on top).
 */

export interface SvgElement {
  tag: string
  attrs: Record<string, string>
  children: SvgElement[]
}

const TAG = /<\s*(\/?)\s*([a-zA-Z]+)([^>]*?)(\/?)\s*>/g
const ATTR = /([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g

/** Parses a well-formed SVG fragment (no comments, CDATA or text content). */
export function parseSvg(markup: string): SvgElement[] {
  const root: SvgElement = { tag: '#root', attrs: {}, children: [] }
  const stack: SvgElement[] = [root]
  for (const match of markup.matchAll(TAG)) {
    const [, closing, tag = '', rawAttrs = '', selfClosing] = match
    const parent = stack[stack.length - 1]
    if (!parent) throw new Error('Unbalanced SVG markup')
    if (closing) {
      if (parent.tag !== tag) throw new Error(`Unexpected </${tag}> inside <${parent.tag}>`)
      stack.pop()
      continue
    }
    const attrs: Record<string, string> = {}
    for (const [, key = '', value = ''] of rawAttrs.matchAll(ATTR)) attrs[key] = value
    const element: SvgElement = { tag, attrs, children: [] }
    parent.children.push(element)
    if (!selfClosing) stack.push(element)
  }
  if (stack.length !== 1) throw new Error(`Unclosed <${stack[stack.length - 1]?.tag}>`)
  return root.children
}

// ── Path data ───────────────────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

export interface PathNode extends Point {
  in?: Point
  out?: Point
}

export interface SubPath {
  nodes: PathNode[]
  closed: boolean
}

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi
const COMMAND = /[MmLlHhVvCcSsQqTtZz]/

function tokenize(d: string): (string | number)[] {
  const tokens: (string | number)[] = []
  let i = 0
  while (i < d.length) {
    const ch = d[i] ?? ''
    if (COMMAND.test(ch)) {
      tokens.push(ch)
      i++
      continue
    }
    NUMBER.lastIndex = i
    const match = NUMBER.exec(d)
    if (match && match.index === i) {
      tokens.push(Number(match[0]))
      i += match[0].length
      continue
    }
    i++ // whitespace and commas
  }
  return tokens
}

const ARITY: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, Z: 0 }

/** Parses SVG path data into subpaths with absolute cubic control points. */
export function parsePathData(d: string): SubPath[] {
  const tokens = tokenize(d)
  const subpaths: SubPath[] = []
  let current: SubPath | null = null
  let pen: Point = { x: 0, y: 0 }
  let start: Point = { x: 0, y: 0 }
  let lastCubic: Point | null = null
  let lastQuad: Point | null = null
  let command = ''
  let i = 0

  const lastNode = () => current?.nodes[current.nodes.length - 1]
  const lineTo = (p: Point) => {
    current?.nodes.push({ ...p })
    pen = p
  }
  const cubicTo = (c1: Point, c2: Point, p: Point) => {
    const from = lastNode()
    if (from) from.out = c1
    current?.nodes.push({ ...p, in: c2 })
    pen = p
  }

  while (i < tokens.length) {
    const token = tokens[i]
    if (typeof token === 'string') {
      command = token
      i++
      if (command === 'Z' || command === 'z') {
        if (current) current.closed = true
        pen = start
        lastCubic = lastQuad = null
        continue
      }
    } else if (!command) {
      throw new Error(`Path data must start with a command: ${d}`)
    }

    const upper = command.toUpperCase()
    const relative = command !== upper
    const arity = ARITY[upper] ?? 0
    const args = tokens.slice(i, i + arity)
    if (args.length < arity || args.some((a) => typeof a !== 'number')) {
      throw new Error(`Bad arguments for "${command}" in: ${d}`)
    }
    i += arity
    const n = args as number[]
    const ox = relative ? pen.x : 0
    const oy = relative ? pen.y : 0
    const at = (k: number): Point => ({ x: (n[k] ?? 0) + ox, y: (n[k + 1] ?? 0) + oy })
    let nextCubic: Point | null = null
    let nextQuad: Point | null = null

    switch (upper) {
      case 'M': {
        const p = at(0)
        current = { nodes: [{ ...p }], closed: false }
        subpaths.push(current)
        pen = start = p
        // Further coordinate pairs after a moveto are implicit linetos.
        command = relative ? 'l' : 'L'
        break
      }
      case 'L':
        lineTo(at(0))
        break
      case 'H':
        lineTo({ x: (n[0] ?? 0) + ox, y: pen.y })
        break
      case 'V':
        lineTo({ x: pen.x, y: (n[0] ?? 0) + oy })
        break
      case 'C': {
        const c2 = at(2)
        cubicTo(at(0), c2, at(4))
        nextCubic = c2
        break
      }
      case 'S': {
        const c1 = lastCubic ? reflect(lastCubic, pen) : pen
        const c2 = at(0)
        cubicTo(c1, c2, at(2))
        nextCubic = c2
        break
      }
      case 'Q':
      case 'T': {
        const q: Point = upper === 'Q' ? at(0) : lastQuad ? reflect(lastQuad, pen) : pen
        const p = upper === 'Q' ? at(2) : at(0)
        const from = pen
        cubicTo(lerp(from, q, 2 / 3), lerp(p, q, 2 / 3), p)
        nextQuad = q
        break
      }
    }
    lastCubic = nextCubic
    lastQuad = nextQuad
  }

  for (const sub of subpaths) closeLoop(sub)
  return subpaths.filter((sub) => sub.nodes.length > 1)
}

function reflect(control: Point, about: Point): Point {
  return { x: 2 * about.x - control.x, y: 2 * about.y - control.y }
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

const near = (a: Point, b: Point) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6

/** A closed path whose last node repeats the first: merge them (keep the closing curve). */
function closeLoop(sub: SubPath): void {
  if (!sub.closed || sub.nodes.length < 3) return
  const first = sub.nodes[0]
  const last = sub.nodes[sub.nodes.length - 1]
  if (!first || !last || !near(first, last)) return
  if (last.in) first.in = last.in
  sub.nodes.pop()
}

/** True when the vertices run clockwise on screen (y grows downward). */
export function isClockwise(nodes: readonly Point[]): boolean {
  let area = 0
  nodes.forEach((p, k) => {
    const q = nodes[(k + 1) % nodes.length] ?? p
    area += p.x * q.y - q.x * p.y
  })
  return area >= 0
}

// ── RML output ──────────────────────────────────────────────────────────────────────────

const fmt = (v: number) => String(Math.round(v * 1000) / 1000)

export function rmlColor(css: string, opacity = 1): string {
  const hex = css.trim().replace('#', '')
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((h) => h + h)
          .join('')
      : hex
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Unsupported color: ${css}`)
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${alpha}${full}`.toUpperCase()
}

function vertexRml(node: PathNode): string {
  if (!node.in && !node.out) return `<StraightVertex x="${fmt(node.x)}" y="${fmt(node.y)}"/>`
  const handle = (h: Point | undefined) =>
    h
      ? {
          rotation: Math.atan2(h.y - node.y, h.x - node.x),
          distance: Math.hypot(h.x - node.x, h.y - node.y),
        }
      : { rotation: 0, distance: 0 }
  const inH = handle(node.in)
  const outH = handle(node.out)
  return (
    `<CubicDetachedVertex x="${fmt(node.x)}" y="${fmt(node.y)}" ` +
    `inRotation="${fmt(inH.rotation)}" inDistance="${fmt(inH.distance)}" ` +
    `outRotation="${fmt(outH.rotation)}" outDistance="${fmt(outH.distance)}"/>`
  )
}

export function pointsPathRml(sub: SubPath): string {
  return (
    `<PointsPath isClosed="${sub.closed}" isClockwise="${isClockwise(sub.nodes)}">` +
    sub.nodes.map(vertexRml).join('') +
    `</PointsPath>`
  )
}

interface Style {
  fill: string
  stroke: string
  strokeWidth: number
  linecap: string
  linejoin: string
  dasharray: string
  opacity: number
}

const DEFAULT_STYLE: Style = {
  fill: '#000000', // SVG's default fill
  stroke: 'none',
  strokeWidth: 1,
  linecap: 'butt',
  linejoin: 'miter',
  dasharray: 'none',
  opacity: 1,
}

function inherit(style: Style, attrs: Record<string, string>): Style {
  return {
    fill: attrs.fill ?? style.fill,
    stroke: attrs.stroke ?? style.stroke,
    strokeWidth:
      attrs['stroke-width'] !== undefined ? Number(attrs['stroke-width']) : style.strokeWidth,
    linecap: attrs['stroke-linecap'] ?? style.linecap,
    linejoin: attrs['stroke-linejoin'] ?? style.linejoin,
    dasharray: attrs['stroke-dasharray'] ?? style.dasharray,
    // Group opacity multiplies down; we bake it into each shape.
    opacity: style.opacity * (attrs.opacity !== undefined ? Number(attrs.opacity) : 1),
  }
}

function paintsRml(style: Style): string {
  let out = ''
  if (style.fill !== 'none') {
    out += `<Fill><SolidColor colorValue="${rmlColor(style.fill, style.opacity)}"/></Fill>`
  }
  if (style.stroke !== 'none' && style.strokeWidth > 0) {
    const dashes =
      style.dasharray !== 'none'
        ? `<DashPath>${style.dasharray
            .split(/[\s,]+/)
            .filter(Boolean)
            .map((len) => `<Dash length="${fmt(Number(len))}"/>`)
            .join('')}</DashPath>`
        : ''
    out +=
      `<Stroke thickness="${fmt(style.strokeWidth)}" cap="${style.linecap}" join="${style.linejoin}">` +
      `<SolidColor colorValue="${rmlColor(style.stroke, style.opacity)}"/>${dashes}</Stroke>`
  }
  return out
}

/** Only `rotate(deg cx cy)` is supported (all the art needs). Returns [radians, cx, cy]. */
function parseRotate(transform: string | undefined): [number, number, number] | null {
  if (!transform) return null
  const match = /^rotate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+))?\s*\)$/.exec(
    transform.trim(),
  )
  if (!match) throw new Error(`Unsupported transform: ${transform}`)
  return [(Number(match[1]) * Math.PI) / 180, Number(match[2] ?? 0), Number(match[3] ?? 0)]
}

function nameAndId(attrs: Record<string, string>, fallback: string): string {
  const id = attrs['data-id'] ? ` id="${attrs['data-id']}"` : ''
  return `name="${attrs['data-name'] ?? fallback}"${id}`
}

let shapeCount = 0

/** Restarts the automatic shape names ("path 1"…) so each scene is generated identically. */
export function resetShapeNames(): void {
  shapeCount = 0
}

function shapeRml(el: SvgElement, style: Style): string {
  const a = el.attrs
  const label = nameAndId(a, `${el.tag} ${++shapeCount}`)
  const paints = paintsRml(style)
  switch (el.tag) {
    case 'path': {
      const geometry = parsePathData(a.d ?? '')
        .map(pointsPathRml)
        .join('')
      return geometry ? `<Shape ${label}>${geometry}${paints}</Shape>` : ''
    }
    case 'rect': {
      const w = Number(a.width)
      const h = Number(a.height)
      let cx = Number(a.x ?? 0) + w / 2
      let cy = Number(a.y ?? 0) + h / 2
      let rotation = 0
      const rotate = parseRotate(a.transform)
      if (rotate) {
        const [rad, px, py] = rotate
        const dx = cx - px
        const dy = cy - py
        cx = px + dx * Math.cos(rad) - dy * Math.sin(rad)
        cy = py + dx * Math.sin(rad) + dy * Math.cos(rad)
        rotation = rad
      }
      const r = Number(a.rx ?? a.ry ?? 0)
      return (
        `<Shape ${label} x="${fmt(cx)}" y="${fmt(cy)}" rotation="${fmt(rotation)}">` +
        `<Rectangle width="${fmt(w)}" height="${fmt(h)}" originX="0.5" originY="0.5" cornerRadiusTL="${fmt(r)}"/>` +
        `${paints}</Shape>`
      )
    }
    case 'circle':
    case 'ellipse': {
      const rx = Number(el.tag === 'circle' ? a.r : a.rx)
      const ry = Number(el.tag === 'circle' ? a.r : a.ry)
      return (
        `<Shape ${label} x="${fmt(Number(a.cx ?? 0))}" y="${fmt(Number(a.cy ?? 0))}">` +
        `<Ellipse width="${fmt(rx * 2)}" height="${fmt(ry * 2)}" originX="0.5" originY="0.5"/>` +
        `${paints}</Shape>`
      )
    }
    default:
      throw new Error(`Unsupported SVG element <${el.tag}>`)
  }
}

/**
 * Converts parsed SVG to RML siblings in Rive draw order. A `<g>` with `data-name` becomes a
 * named `Node` (optionally with `data-id`), so it can be animated; other groups only pass
 * their style down.
 */
export function toRml(elements: SvgElement[], parentStyle: Style = DEFAULT_STYLE): string {
  const parts: string[] = []
  for (const el of elements) {
    const style = inherit(parentStyle, el.attrs)
    if (el.tag === 'g') {
      const inner = toRml(el.children, style)
      parts.push(
        el.attrs['data-name'] ? `<Node ${nameAndId(el.attrs, 'Group')}>${inner}</Node>` : inner,
      )
    } else {
      parts.push(shapeRml(el, style))
    }
  }
  return parts.reverse().join('\n')
}

export function svgToRml(markup: string): string {
  return toRml(parseSvg(markup))
}
