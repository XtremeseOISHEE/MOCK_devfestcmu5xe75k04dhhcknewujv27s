import { useEffect, useMemo, useState } from 'react'
import { SAMPLE } from './data.js'
import { T } from './i18n.js'
import { findRoute } from './routing.js'
import Header from './components/Header.jsx'
import MapView from './components/MapView.jsx'
import RoutePanel from './components/RoutePanel.jsx'
import HazardPanel from './components/HazardPanel.jsx'
import Legend from './components/Legend.jsx'

const LANG_KEY = 'smart-escape-lang'

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'bn' || saved === 'en') return saved
  } catch {
    // storage unavailable — fall back to default
  }
  return 'bn'
}

function hazardsFrom(graph) {
  const init = graph.initial_state || {}
  return {
    blocked_nodes: [...(init.blocked_nodes || [])],
    blocked_edges: [...(init.blocked_edges || [])],
    closed_exits: [...(init.closed_exits || [])],
  }
}

function App() {
  const [graph, setGraph] = useState(SAMPLE)
  const [hazards, setHazards] = useState(() => hazardsFrom(SAMPLE))
  const [start, setStart] = useState(null)
  const [lang, setLang] = useState(loadLang)

  const t = T[lang]

  const route = useMemo(
    () => (start ? findRoute(graph, hazards, start) : null),
    [graph, hazards, start],
  )

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // ignore
    }
    document.documentElement.lang = lang
    document.title = t.appTitle
  }, [lang, t])

  const toggleLang = () => setLang((l) => (l === 'bn' ? 'en' : 'bn'))

  // key is one of blocked_nodes, blocked_edges, closed_exits.
  const toggleHazard = (key, id) =>
    setHazards((h) => {
      const list = h[key]
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
      return { ...h, [key]: next }
    })

  const resetHazards = () => setHazards(hazardsFrom(graph))

  return (
    <div className="app">
      <Header t={t} buildingName={graph.building} onToggleLang={toggleLang} />
      <main className="layout">
        <section className="map-panel">
          <MapView
            t={t}
            graph={graph}
            hazards={hazards}
            start={start}
            route={route}
            onSelectStart={setStart}
            onToggleHazard={toggleHazard}
          />
        </section>
        <aside className="side-panel">
          <RoutePanel t={t} graph={graph} start={start} route={route} />
          <HazardPanel
            t={t}
            graph={graph}
            hazards={hazards}
            onToggleHazard={toggleHazard}
            onReset={resetHazards}
          />
          <Legend t={t} />
        </aside>
      </main>
    </div>
  )
}

export default App
