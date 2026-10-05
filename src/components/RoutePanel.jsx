function RoutePanel({ t, graph, start, route }) {
  const byId = new Map((graph.nodes || []).map((n) => [n.id, n]))
  const labelOf = (id) => byId.get(id)?.label ?? id
  const fmt = new Intl.NumberFormat(t.locale)

  let body
  if (!start) {
    body = <p className="panel-message">{t.selectStart}</p>
  } else if (route.status === 'START_BLOCKED') {
    body = <p className="panel-message panel-warning">{t.startBlocked}</p>
  } else if (route.status === 'NO_ROUTE') {
    body = <p className="panel-message panel-warning">{t.noRoute}</p>
  } else {
    body = (
      <>
        <div className="route-field">
          <span className="route-key">{t.route}</span>
          <ol className="route-steps">
            {route.path.map((id, i) => (
              <li key={`${id}-${i}`}>{labelOf(id)}</li>
            ))}
          </ol>
        </div>
        <div className="route-field">
          <span className="route-key">{t.exit}</span>
          <span className="route-value">{labelOf(route.exit)}</span>
        </div>
        <div className="route-field">
          <span className="route-key">{t.totalCost}</span>
          <span className="route-value route-cost">{fmt.format(route.cost)}</span>
        </div>
      </>
    )
  }

  return (
    <div className="route-panel">
      {start && (
        <div className="route-field">
          <span className="route-key">{t.startLocation}</span>
          <span className="route-value">{labelOf(start)}</span>
        </div>
      )}
      {body}
    </div>
  )
}

export default RoutePanel
