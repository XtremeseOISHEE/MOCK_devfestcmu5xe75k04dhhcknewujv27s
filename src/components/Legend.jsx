// Swatches reuse the map's CSS classes so the legend always matches the SVG.
function NodeSwatch({ className, mark, ring }) {
  return (
    <svg className="legend-swatch" viewBox="-14 -14 28 28" aria-hidden="true">
      <g className={className}>
        {ring && <circle className="start-ring" r={13} />}
        <circle className="node-dot" r={9} />
        {mark === 'cross' && <path className="node-mark" d="M-5 -5L5 5M5 -5L-5 5" />}
        {mark === 'slash' && <path className="node-mark" d="M-6 6L6 -6" />}
      </g>
    </svg>
  )
}

function EdgeSwatch({ className }) {
  return (
    <svg className="legend-swatch" viewBox="0 -14 40 28" aria-hidden="true">
      <line className={className} x1={2} y1={0} x2={38} y2={0} />
    </svg>
  )
}

function Legend({ t }) {
  const items = [
    { key: 'room', swatch: <NodeSwatch className="node node-room" />, label: t.typeRoom },
    { key: 'junction', swatch: <NodeSwatch className="node node-junction" />, label: t.typeJunction },
    { key: 'exit', swatch: <NodeSwatch className="node node-exit" />, label: t.typeExit },
    { key: 'start', swatch: <NodeSwatch className="node node-room" ring />, label: t.startLocation },
    { key: 'route', swatch: <EdgeSwatch className="edge edge-route" />, label: t.route },
    { key: 'corridor', swatch: <EdgeSwatch className="edge" />, label: t.corridor },
    {
      key: 'blockedNode',
      swatch: <NodeSwatch className="node node-room node-blocked" mark="cross" />,
      label: t.blockedNode,
    },
    { key: 'blockedEdge', swatch: <EdgeSwatch className="edge edge-blocked" />, label: t.blockedCorridor },
    {
      key: 'closedExit',
      swatch: <NodeSwatch className="node node-exit node-closed" mark="slash" />,
      label: t.closedExit,
    },
  ]

  return (
    <section className="legend">
      <h2 className="panel-title">{t.legend}</h2>
      <ul className="legend-list">
        {items.map((it) => (
          <li key={it.key} className="legend-item">
            {it.swatch}
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Legend
