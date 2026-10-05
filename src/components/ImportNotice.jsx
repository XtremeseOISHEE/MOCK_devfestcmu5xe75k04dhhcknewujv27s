import { format } from '../i18n.js'

// notice is { kind: 'error', errors: [{ key, params }] } or { kind: 'success', name }.
function ImportNotice({ t, notice, onDismiss }) {
  if (!notice) return null

  if (notice.kind === 'success') {
    return (
      <div className="notice notice-success" role="status">
        <span>{format(t, t.loadedBuilding, { name: notice.name })}</span>
        <button type="button" className="btn btn-small" onClick={onDismiss}>
          {t.dismiss}
        </button>
      </div>
    )
  }

  return (
    <div className="notice notice-error" role="alert">
      <div className="notice-head">
        <h2 className="notice-title">{t.invalidFile}</h2>
        <button type="button" className="btn btn-small" onClick={onDismiss}>
          {t.dismiss}
        </button>
      </div>
      <p className="notice-intro">{t.invalidFileIntro}</p>
      <ul className="notice-list">
        {notice.errors.map((e, i) => (
          <li key={i}>{format(t, t[e.key] ?? e.key, e.params)}</li>
        ))}
      </ul>
    </div>
  )
}

export default ImportNotice
