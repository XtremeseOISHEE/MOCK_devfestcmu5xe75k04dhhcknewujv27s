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

function MapView({ t, graph }) {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  const byId = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg
      className="map"
      viewBox={computeViewBox(nodes)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={t.mapLabel}
    >
      <g className="edges">
        {edges.map((e) => {
          const a = byId.get(e.from)
          const b = byId.get(e.to)
          if (!a || !b) return null
          return (
            <line
              key={e.id}
              className="edge"
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
          )
        })}
      </g>

      <g className="cost-labels">
        {edges.map((e) => {
          const a = byId.get(e.from)
          const b = byId.get(e.to)
          if (!a || !b) return null
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const text = String(e.cost)
          const w = text.length * 7 + 10
          return (
            <g key={e.id} className="cost-chip">
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
        {nodes.map((n) => (
          <g key={n.id} className={`node node-${n.type}`}>
            <circle cx={n.x} cy={n.y} r={NODE_R} />
            <text
              className="node-label"
              x={n.x + NODE_R + 4}
              y={n.y - NODE_R - 2}
            >
              {n.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

export default MapView
