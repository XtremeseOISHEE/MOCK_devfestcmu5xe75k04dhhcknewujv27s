const PAD = 40
// Labels sit to the right of each node, so leave extra room on that side.
const LABEL_PAD_RIGHT = 100
const NODE_R = 10
const CHIP_H = 16
const BTN_R = 7
const BTN_OFFSET = NODE_R + 6

function computeViewBox(nodes) {
  if (nodes.length === 0) return '0 0 100 100'
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs) - PAD
  const minY = Math.min(...ys) - PAD
  const maxX = Math.max(...xs) + LABEL_PAD_RIGHT
  const maxY = Math.max(...ys) + PAD
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
}

// For each consecutive pair on the path, the cheapest open edge joining them.
function routeEdgeIds(path, edges, blockedEdges) {
  const ids = new Set()
  for (let i = 0; i + 1 < path.length; i++) {
    const a = path[i]
    const b = path[i + 1]
    let pick = null
    for (const e of edges) {
      if (blockedEdges.has(e.id)) continue
      const joins = (e.from === a && e.to === b) || (e.from === b && e.to === a)
      if (joins && (!pick || Number(e.cost) < Number(pick.cost))) pick = e
    }
    if (pick) ids.add(pick.id)
  }
  return ids
}

// Props that make an SVG element behave as a keyboard-accessible button.
function buttonProps(label, onActivate, pressed) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
    onClick: onActivate,
    onKeyDown: (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        onActivate()
      }
    },
  }
}

function MapView({ t, graph, hazards, start, route, onSelectStart, onToggleHazard }) {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const blockedNodes = new Set(hazards.blocked_nodes)
  const blockedEdges = new Set(hazards.blocked_edges)
  const closedExits = new Set(hazards.closed_exits)
  const fmt = new Intl.NumberFormat(t.locale)

  const path = route?.status === 'OK' ? route.path : []
  const routeNodes = new Set(path)
  const routeEdges = routeEdgeIds(path, edges, blockedEdges)

  const labelOf = (id) => byId.get(id)?.label ?? id

  const edgeEnds = (e) => {
    const a = byId.get(e.from)
    const b = byId.get(e.to)
    return a && b ? [a, b] : null
  }

  return (
    <svg
      className="map"
      viewBox={computeViewBox(nodes)}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={t.mapLabel}
    >
      <g className="edges">
        {edges.map((e) => {
          const ends = edgeEnds(e)
          if (!ends) return null
          const [a, b] = ends
          const cls = [
            'edge',
            routeEdges.has(e.id) && 'edge-route',
            blockedEdges.has(e.id) && 'edge-blocked',
          ]
            .filter(Boolean)
            .join(' ')
          return <line key={e.id} className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}
      </g>

      {/* Corridor controls: a wide invisible hit line plus the cost chip. */}
      <g className="edge-controls">
        {edges.map((e) => {
          const ends = edgeEnds(e)
          if (!ends) return null
          const [a, b] = ends
          const blocked = blockedEdges.has(e.id)
          const action = blocked ? t.unblock : t.block
          const name = `${labelOf(e.from)} – ${labelOf(e.to)}`
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const text = fmt.format(e.cost)
          const w = text.length * 7 + 10
          const cls = [
            'edge-control',
            routeEdges.has(e.id) && 'cost-chip-route',
            blocked && 'cost-chip-blocked',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <g
              key={e.id}
              className={cls}
              {...buttonProps(`${action}: ${name}`, () => onToggleHazard('blocked_edges', e.id), blocked)}
            >
              <title>{`${action}: ${name}`}</title>
              <line className="edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <g className="cost-chip">
                <rect
                  x={mx - w / 2}
                  y={my - CHIP_H / 2}
                  width={w}
                  height={CHIP_H}
                  rx={CHIP_H / 2}
                />
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="central">
                  {text}
                </text>
              </g>
            </g>
          )
        })}
      </g>

      <g className="nodes">
        {nodes.map((n) => {
          const isExit = n.type === 'exit'
          const blocked = blockedNodes.has(n.id)
          const closed = isExit && closedExits.has(n.id)
          const selectable = !isExit && !blocked
          const cls = [
            'node',
            `node-${n.type}`,
            selectable && 'node-selectable',
            isExit && 'node-exit-toggle',
            routeNodes.has(n.id) && 'node-route',
            n.id === start && 'node-start',
            blocked && 'node-blocked',
            closed && 'node-closed',
          ]
            .filter(Boolean)
            .join(' ')

          const toggleExit = () => onToggleHazard('closed_exits', n.id)
          let dotProps = {}
          if (selectable) {
            dotProps = buttonProps(n.label, () => onSelectStart(n.id), n.id === start)
          } else if (isExit) {
            // Mouse shortcut only; the keyboard uses the control button below.
            dotProps = { onClick: toggleExit }
          }

          const hazardKey = isExit ? 'closed_exits' : 'blocked_nodes'
          const hazardOn = isExit ? closed : blocked
          const hazardAction = isExit
            ? (closed ? t.reopen : t.close)
            : (blocked ? t.unblock : t.block)
          const bx = n.x + BTN_OFFSET
          const by = n.y + BTN_OFFSET

          return (
            <g key={n.id} className={cls}>
              <g className="node-body" {...dotProps}>
                {n.id === start && (
                  <circle className="start-ring" cx={n.x} cy={n.y} r={NODE_R + 6} />
                )}
                <circle className="node-dot" cx={n.x} cy={n.y} r={NODE_R} />
                {blocked && (
                  <path
                    className="node-mark"
                    d={`M${n.x - 6} ${n.y - 6}L${n.x + 6} ${n.y + 6}M${n.x + 6} ${n.y - 6}L${n.x - 6} ${n.y + 6}`}
                  />
                )}
                {closed && !blocked && (
                  <path
                    className="node-mark"
                    d={`M${n.x - 7} ${n.y + 7}L${n.x + 7} ${n.y - 7}`}
                  />
                )}
                <text className="node-label" x={n.x + NODE_R + 4} y={n.y - NODE_R - 2}>
                  {n.label}
                </text>
              </g>

              <g
                className={hazardOn ? 'hazard-btn hazard-btn-on' : 'hazard-btn'}
                {...buttonProps(
                  `${hazardAction}: ${n.label}`,
                  () => onToggleHazard(hazardKey, n.id),
                  hazardOn,
                )}
              >
                <title>{`${hazardAction}: ${n.label}`}</title>
                <circle cx={bx} cy={by} r={BTN_R} />
                <circle className="hazard-icon" cx={bx} cy={by} r={3.5} />
                <path
                  className="hazard-icon"
                  d={`M${bx - 2.5} ${by + 2.5}L${bx + 2.5} ${by - 2.5}`}
                />
              </g>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default MapView
