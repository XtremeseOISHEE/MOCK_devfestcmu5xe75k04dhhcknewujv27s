// Full validation of a building file. Collects every problem rather than
// stopping at the first. Each error is { key, params } where key is an
// i18n.js message key, so the list can be shown in either language.

export const LIMITS = {
  minNodes: 2,
  maxNodes: 60,
  minEdges: 1,
  maxEdges: 150,
}

const NODE_TYPES = ['room', 'junction', 'exit']

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== ''
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v)

// Short printable form of an arbitrary value for error messages.
function show(v) {
  let s
  try {
    s = JSON.stringify(v)
  } catch {
    s = String(v)
  }
  if (s === undefined) s = String(v)
  return s.length > 40 ? `${s.slice(0, 37)}...` : s
}

// An ID as written in the file; non-strings are shown in JSON form.
const idText = (v) => (typeof v === 'string' ? v : show(v))

export function validateBuilding(data) {
  const errors = []
  const err = (key, params = {}) => errors.push({ key, params })

  if (!isObject(data)) {
    err('errNotObject')
    return errors
  }

  if (!isNonEmptyString(data.building)) err('errBuilding')

  // Nodes
  const nodeTypes = new Map() // id -> type (first occurrence)
  const nodes = data.nodes
  if (!Array.isArray(nodes)) {
    err('errNodesArray')
  } else if (nodes.length === 0) {
    err('errNodesEmpty')
  } else {
    if (nodes.length < LIMITS.minNodes || nodes.length > LIMITS.maxNodes) {
      err('errNodeCount', { min: LIMITS.minNodes, max: LIMITS.maxNodes, count: nodes.length })
    }
    nodes.forEach((n, i) => {
      const pos = i + 1
      if (!isObject(n)) {
        err('errNodeNotObject', { n: pos })
        return
      }
      let ref
      if (!isNonEmptyString(n.id)) {
        err('errNodeId', { n: pos })
        ref = `#${pos}`
      } else {
        ref = n.id
        if (nodeTypes.has(n.id)) err('errNodeIdDup', { id: n.id })
        else nodeTypes.set(n.id, n.type)
      }
      if (!isNonEmptyString(n.label)) err('errNodeLabel', { id: ref })
      if (!NODE_TYPES.includes(n.type)) err('errNodeType', { id: ref, value: show(n.type) })
      if (!isNumber(n.x) || !isNumber(n.y)) err('errNodeCoords', { id: ref })
    })

    const types = [...nodeTypes.values()]
    if (!types.some((t) => t === 'room' || t === 'junction')) err('errNoWalkable')
    if (!types.includes('exit')) err('errNoExit')
  }

  // Edges
  const edgeIds = new Set()
  const pairs = new Map() // "a\u0000b" (sorted) -> first edge id
  const edges = data.edges
  if (!Array.isArray(edges)) {
    err('errEdgesArray')
  } else if (edges.length === 0) {
    err('errEdgesEmpty')
  } else {
    if (edges.length < LIMITS.minEdges || edges.length > LIMITS.maxEdges) {
      err('errEdgeCount', { min: LIMITS.minEdges, max: LIMITS.maxEdges, count: edges.length })
    }
    edges.forEach((e, i) => {
      const pos = i + 1
      if (!isObject(e)) {
        err('errEdgeNotObject', { n: pos })
        return
      }
      let ref
      if (!isNonEmptyString(e.id)) {
        err('errEdgeId', { n: pos })
        ref = `#${pos}`
      } else {
        ref = e.id
        if (edgeIds.has(e.id)) err('errEdgeIdDup', { id: e.id })
        else edgeIds.add(e.id)
      }

      for (const field of ['from', 'to']) {
        if (!nodeTypes.has(e[field])) {
          err('errEdgeEndpoint', { id: ref, field, node: idText(e[field]) })
        }
      }

      if (!(typeof e.cost === 'number' && Number.isInteger(e.cost) && e.cost > 0)) {
        err('errEdgeCost', { id: ref, value: show(e.cost) })
      }

      if (typeof e.from === 'string' && typeof e.to === 'string') {
        if (e.from === e.to) {
          err('errSelfLoop', { id: ref, node: e.from })
        } else {
          const [a, b] = e.from < e.to ? [e.from, e.to] : [e.to, e.from]
          const key = `${a}\u0000${b}`
          if (pairs.has(key)) {
            err('errDupPair', { id: ref, other: pairs.get(key), a: e.from, b: e.to })
          } else {
            pairs.set(key, ref)
          }
        }
      }
    })
  }

  // Initial state
  const init = data.initial_state
  if (!isObject(init)) {
    err('errInitialState')
  } else {
    const lists = ['blocked_nodes', 'blocked_edges', 'closed_exits']
    for (const list of lists) {
      if (!Array.isArray(init[list])) err('errInitialList', { list })
    }

    if (Array.isArray(init.blocked_nodes)) {
      for (const id of init.blocked_nodes) {
        if (!nodeTypes.has(id)) err('errBlockedNodeUnknown', { id: idText(id) })
        else if (nodeTypes.get(id) === 'exit') err('errBlockedNodeType', { id })
      }
    }
    if (Array.isArray(init.blocked_edges)) {
      for (const id of init.blocked_edges) {
        if (!edgeIds.has(id)) err('errBlockedEdgeUnknown', { id: idText(id) })
      }
    }
    if (Array.isArray(init.closed_exits)) {
      for (const id of init.closed_exits) {
        if (!nodeTypes.has(id)) err('errClosedExitUnknown', { id: idText(id) })
        else if (nodeTypes.get(id) !== 'exit') err('errClosedExitType', { id })
      }
    }
  }

  return errors
}
