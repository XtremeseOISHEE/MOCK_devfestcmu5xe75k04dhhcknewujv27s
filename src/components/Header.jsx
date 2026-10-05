function Header({ t, buildingName, onToggleLang, onImportFile, onLoadSample }) {
  const handleFile = (ev) => {
    const file = ev.target.files?.[0]
    // Clear so choosing the same file again still fires a change event.
    ev.target.value = ''
    if (file) onImportFile(file)
  }

  return (
    <header className="header">
      <div className="header-titles">
        <h1 className="app-title">{t.appTitle}</h1>
        {buildingName && <p className="building-name">{buildingName}</p>}
      </div>
      <div className="header-actions">
        <label className="btn file-btn">
          {t.importJson}
          <input
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            onChange={handleFile}
          />
        </label>
        <button type="button" className="btn" onClick={onLoadSample}>
          {t.loadSample}
        </button>
        <button type="button" className="btn lang-toggle" onClick={onToggleLang}>
          {t.langToggle}
        </button>
      </div>
    </header>
  )
}

export default Header
