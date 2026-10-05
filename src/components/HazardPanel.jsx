import { format } from '../i18n.js'

function HazardRow({ name, active, status, onLabel, offLabel, onToggle }) {
  return (
    <li className={active ? 'hazard-row hazard-row-on' : 'hazard-row'}>
      <span className="hazard-name">
        {name}
        {active && <span className="hazard-status">{status}</span>}
      </span>
      <button
        type="button"
        className={active ? 'btn btn-small btn-on' : 'btn btn-small'}
        aria-pressed={active}
        onClick={onToggle}
      >
        {active ? onLabel : offLabel}
      </button>
    </li>
  )
}

function HazardPanel({ t, graph, hazards, onToggleHazard, onReset }) {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const labelOf = (id) => byId.get(id)?.label ?? id

  const blockedNodes = new Set(hazards.blocked_nodes)
  const blockedEdges = new Set(hazards.blocked_edges)
  const closedExits = new Set(hazards.closed_exits)

  const nodeGroups = [
    { type: 'room', heading: t.groupRooms },
    { type: 'junction', heading: t.groupJunctions },
  ]
  const exits = nodes.filter((n) => n.type === 'exit')

  return (
    <section className="hazard-panel">
      <div className="panel-head">
        <h2 className="panel-title">{t.hazards}</h2>
        <button type="button" className="btn" onClick={onReset}>
          {t.reset}
        </button>
      </div>

      {nodeGroups.map(({ type, heading }) => {
        const list = nodes.filter((n) => n.type === type)
        if (list.length === 0) return null
        return (
          <div key={type} className="hazard-group">
            <h3 className="group-title">{heading}</h3>
            <ul className="hazard-list">
              {list.map((n) => (
                <HazardRow
                  key={n.id}
                  name={n.label}
                  active={blockedNodes.has(n.id)}
                  status={t.blocked}
                  onLabel={t.unblock}
                  offLabel={t.block}
                  onToggle={() => onToggleHazard('blocked_nodes', n.id)}
                />
              ))}
            </ul>
          </div>
        )
      })}

      {exits.length > 0 && (
        <div className="hazard-group">
          <h3 className="group-title">{t.groupExits}</h3>
          <ul className="hazard-list">
            {exits.map((n) => (
              <HazardRow
                key={n.id}
                name={n.label}
                active={closedExits.has(n.id)}
                status={t.closed}
                onLabel={t.reopen}
                offLabel={t.close}
                onToggle={() => onToggleHazard('closed_exits', n.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {edges.length > 0 && (
        <div className="hazard-group">
          <h3 className="group-title">{t.groupCorridors}</h3>
          <ul className="hazard-list">
            {edges.map((e) => (
              <HazardRow
                key={e.id}
                name={format(t, t.corridorName, { a: labelOf(e.from), b: labelOf(e.to) })}
                active={blockedEdges.has(e.id)}
                status={t.blocked}
                onLabel={t.unblock}
                offLabel={t.block}
                onToggle={() => onToggleHazard('blocked_edges', e.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default HazardPanel
