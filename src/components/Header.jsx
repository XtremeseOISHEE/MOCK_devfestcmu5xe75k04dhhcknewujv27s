function Header({ t, buildingName, onToggleLang }) {
  return (
    <header className="header">
      <div className="header-titles">
        <h1 className="app-title">{t.appTitle}</h1>
        {buildingName && <p className="building-name">{buildingName}</p>}
      </div>
      <button type="button" className="lang-toggle" onClick={onToggleLang}>
        {t.langToggle}
      </button>
    </header>
  )
}

export default Header
