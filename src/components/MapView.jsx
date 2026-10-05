const PAD = 40
// Labels sit to the right of each node, so leave extra room on that side.
const LABEL_PAD_RIGHT = 100
const NODE_R = 10
const CHIP_H = 16

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

function MapView({ t, graph, hazards, start, route, onSelectStart }) {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const blockedNodes = new Set(hazards.blocked_nodes)
  const fmt = new Intl.NumberFormat(t.locale)

  const path = route?.status === 'OK' ? route.path : []
  const routeNodes = new Set(path)
  const routeEdges = routeEdgeIds(path, edges, new Set(hazards.blocked_edges))

  const isSelectable = (n) =>
    (n.type === 'room' || n.type === 'junction') && !blockedNodes.has(n.id)

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
          const cls = routeEdges.has(e.id) ? 'edge edge-route' : 'edge'
          return <line key={e.id} className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}
      </g>

      <g className="cost-labels">
        {edges.map((e) => {
          const ends = edgeEnds(e)
          if (!ends) return null
          const [a, b] = ends
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const text = fmt.format(e.cost)
          const w = text.length * 7 + 10
          const cls = routeEdges.has(e.id) ? 'cost-chip cost-chip-route' : 'cost-chip'
          return (
            <g key={e.id} className={cls}>
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
          )
        })}
      </g>

      <g className="nodes">
        {nodes.map((n) => {
          const selectable = isSelectable(n)
          const cls = [
            'node',
            `node-${n.type}`,
            selectable && 'node-selectable',
            routeNodes.has(n.id) && 'node-route',
            n.id === start && 'node-start',
          ]
            .filter(Boolean)
            .join(' ')
          const select = () => onSelectStart(n.id)
          return (
            <g
              key={n.id}
              className={cls}
              {...(selectable && {
                role: 'button',
                tabIndex: 0,
                'aria-label': n.label,
                'aria-pressed': n.id === start,
                onClick: select,
                onKeyDown: (ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    select()
                  }
                },
              })}
            >
              {n.id === start && <circle className="start-ring" cx={n.x} cy={n.y} r={NODE_R + 6} />}
              <circle className="node-dot" cx={n.x} cy={n.y} r={NODE_R} />
              <text className="node-label" x={n.x + NODE_R + 4} y={n.y - NODE_R - 2}>
                {n.label}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default MapView
