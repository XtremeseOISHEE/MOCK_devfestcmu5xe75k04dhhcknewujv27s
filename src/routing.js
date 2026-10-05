// Shortest evacuation route over an undirected, weighted building graph.
// Cost is the sum of edge costs only.

// Element-by-element string comparison of two node-ID arrays.
// A proper prefix sorts before the longer array.
export function comparePaths(a, b) {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const x = String(a[i])
    const y = String(b[i])
    if (x < y) return -1
    if (x > y) return 1
  }
  return a.length - b.length
}

export function findRoute(graph, hazards, startId) {
  const blockedNodes = new Set(hazards?.blocked_nodes || [])
  const blockedEdges = new Set(hazards?.blocked_edges || [])
  const closedExits = new Set(hazards?.closed_exits || [])

  if (blockedNodes.has(startId)) return { status: 'START_BLOCKED' }

  const nodes = graph?.nodes || []
  const edges = graph?.edges || []

  // Nodes usable anywhere on a route: not blocked, and not a closed exit.
  const usable = new Map()
  for (const n of nodes) {
    if (blockedNodes.has(n.id)) continue
    if (n.type === 'exit' && closedExits.has(n.id)) continue
    usable.set(n.id, n)
  }
  if (!usable.has(startId)) return { status: 'NO_ROUTE' }

  // Undirected adjacency, skipping blocked edges and edges touching excluded nodes.
  const adj = new Map()
  for (const id of usable.keys()) adj.set(id, [])
  for (const e of edges) {
    if (blockedEdges.has(e.id)) continue
    if (!usable.has(e.from) || !usable.has(e.to)) continue
    const cost = Number(e.cost)
    adj.get(e.from).push({ to: e.to, cost })
    adj.get(e.to).push({ to: e.from, cost })
  }

  // Dijkstra. Each node keeps its best (cost, path); equal costs are broken
  // by the lexicographically smaller path, never by overwrite order.
  const best = new Map([[startId, { cost: 0, path: [startId] }]])
  const done = new Set()

  const better = (cand, cur) =>
    !cur ||
    cand.cost < cur.cost ||
    (cand.cost === cur.cost && comparePaths(cand.path, cur.path) < 0)

  for (;;) {
    let u = null
    let uBest = null
    for (const [id, b] of best) {
      if (done.has(id)) continue
      if (better(b, uBest)) {
        u = id
        uBest = b
      }
    }
    if (u === null) break
    done.add(u)

    for (const { to, cost } of adj.get(u)) {
      if (done.has(to)) continue
      const cand = { cost: uBest.cost + cost, path: [...uBest.path, to] }
      if (better(cand, best.get(to))) best.set(to, cand)
    }
  }

  // Cheapest reachable open exit; ties go to the smallest exit ID.
  let chosen = null
  for (const [id, b] of best) {
    if (usable.get(id).type !== 'exit') continue
    if (
      !chosen ||
      b.cost < chosen.cost ||
      (b.cost === chosen.cost && String(id) < String(chosen.exit))
    ) {
      chosen = { exit: id, cost: b.cost, path: b.path }
    }
  }

  if (!chosen) return { status: 'NO_ROUTE' }
  return { status: 'OK', path: chosen.path, exit: chosen.exit, cost: chosen.cost }
}
