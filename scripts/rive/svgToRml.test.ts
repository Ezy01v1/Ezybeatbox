import { describe, expect, it } from 'vitest'
import { isClockwise, parsePathData, parseSvg, rmlColor, svgToRml } from './svgToRml'

describe('parsePathData', () => {
  it('handles relative moveto with implicit lineto, h, v and Z', () => {
    const [sub] = parsePathData('m10 10 5 0h5v5Z')
    expect(sub?.closed).toBe(true)
    expect(sub?.nodes.map(({ x, y }) => [x, y])).toEqual([
      [10, 10],
      [15, 10],
      [20, 10],
      [20, 15],
    ])
  })

  it('splits subpaths and keeps open ones open', () => {
    const subs = parsePathData('M0 0 10 0M20 0l5 5')
    expect(subs).toHaveLength(2)
    expect(subs.every((s) => !s.closed)).toBe(true)
    expect(subs[1]?.nodes[1]).toMatchObject({ x: 25, y: 5 })
  })

  it('turns a quadratic into cubic handles at 2/3 of the control point', () => {
    const [sub] = parsePathData('M0 0Q30 30 60 0')
    expect(sub?.nodes[0]?.out).toEqual({ x: 20, y: 20 })
    expect(sub?.nodes[1]?.in).toEqual({ x: 40, y: 20 })
  })

  it('reflects the previous quadratic control for T', () => {
    const [sub] = parsePathData('M0 0q10 10 20 0t20 0')
    // Reflected control is (30,-10): handles at 2/3 towards it.
    expect(sub?.nodes[1]?.out?.x).toBeCloseTo(26.667, 3)
    expect(sub?.nodes[1]?.out?.y).toBeCloseTo(-6.667, 3)
  })

  it('merges a closing node that repeats the start, keeping its curve', () => {
    const [sub] = parsePathData('M0 0C0 -10 10 -10 10 0C10 10 0 10 0 0Z')
    expect(sub?.nodes).toHaveLength(2)
    expect(sub?.nodes[0]?.in).toEqual({ x: 0, y: 10 })
  })

  it('parses compact numbers like "1.5-3" and ".5.5"', () => {
    const [sub] = parsePathData('M1.5-3L.5.5')
    expect(sub?.nodes.map(({ x, y }) => [x, y])).toEqual([
      [1.5, -3],
      [0.5, 0.5],
    ])
  })
})

describe('isClockwise', () => {
  it('uses screen coordinates (y down)', () => {
    expect(
      isClockwise([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ]),
    ).toBe(true)
    expect(
      isClockwise([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
      ]),
    ).toBe(false)
  })
})

describe('rmlColor', () => {
  it('expands short hex and adds alpha', () => {
    expect(rmlColor('#fa0')).toBe('FFFFAA00')
    expect(rmlColor('#15151e', 0.5)).toBe('8015151E')
  })
})

describe('svgToRml', () => {
  it('inherits group style and paints SVG-black by default', () => {
    const rml = svgToRml('<g stroke="#000" stroke-width="2"><path d="M0 0h10v10Z"/></g>')
    expect(rml).toContain('<Fill><SolidColor colorValue="FF000000"/></Fill>')
    expect(rml).toContain('<Stroke thickness="2" cap="butt" join="miter">')
  })

  it('emits shapes in reverse order (Rive paints the first sibling on top)', () => {
    const rml = svgToRml(
      '<path data-name="Back" d="M0 0h1v1Z"/><path data-name="Front" d="M0 0h1v1Z"/>',
    )
    expect(rml.indexOf('Front')).toBeLessThan(rml.indexOf('Back'))
  })

  it('rotates a rect around the given pivot', () => {
    const rml = svgToRml('<rect x="0" y="0" width="10" height="10" transform="rotate(90 0 0)"/>')
    // Center (5,5) rotated 90° about the origin is (-5,5).
    expect(rml).toContain('x="-5" y="5" rotation="1.571"')
  })

  it('turns named groups into animatable nodes with their id', () => {
    const rml = svgToRml('<g data-name="Eyes" data-id="0:26"><circle cx="1" cy="2" r="3"/></g>')
    expect(rml).toMatch(/^<Node name="Eyes" id="0:26">/)
    expect(rml).toContain('<Ellipse width="6" height="6"')
  })

  it('writes stroke dashes', () => {
    const rml = svgToRml('<path d="M0 0h10" fill="none" stroke="#000" stroke-dasharray="1 4"/>')
    expect(rml).toContain('<DashPath><Dash length="1"/><Dash length="4"/></DashPath>')
  })

  it('rejects markup it does not understand', () => {
    expect(() => parseSvg('<g><path d="M0 0"/>')).toThrow(/Unclosed/)
    expect(() => svgToRml('<polygon points="0,0 1,1"/>')).toThrow(/Unsupported/)
  })
})
