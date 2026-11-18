import { useEffect, useState, type ChangeEvent } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import build from './generated/build.json'
import { APPS, type AppId } from './apps/registry'
import Calculator from './apps/Calculator'
import Notes from './apps/Notes'
import Tasks from './apps/Tasks'
import { STORAGE_PREFIX, useStoredState } from './storage'

type Screen = 'home' | 'settings' | AppId
type Theme = 'dark' | 'light'
type Version = { version: string; build: string; commit: string; builtAt: string }

const toolComponents = {
  calculator: Calculator,
  notes: Notes,
  tasks: Tasks
}

function Settings({ theme, setTheme }: { theme: Theme; setTheme: (next: Theme) => void }) {
  const [message, setMessage] = useState('')

  function exportData() {
    const data: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key)
        if (value !== null) data[key] = value
      }
    }
    const blob = new Blob([JSON.stringify({ app: 'hayko-webstore', exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'hayko-backup.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(href), 1000)
    setMessage('Backup wurde zum Download vorbereitet.')
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || !('app' in parsed) || parsed.app !== 'hayko-webstore' || !('data' in parsed) || typeof parsed.data !== 'object' || !parsed.data) throw new Error('Ungültiges Backup-Format')
      const data = parsed.data as Record<string, unknown>
      for (const [key, value] of Object.entries(data)) {
        if (!key.startsWith(STORAGE_PREFIX) || typeof value !== 'string') throw new Error('Ungültige Backup-Daten')
        JSON.parse(value)
      }
      for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value as string)
      window.location.reload()
    } catch {
      setMessage('Import fehlgeschlagen: Bitte ein gültiges Hayko-Backup auswählen.')
      event.target.value = ''
    }
  }

  return <div className="settings-stack">
    <section className="panel">
      <div className="section-heading"><span className="section-kicker">AUSSEHEN</span><h2>Design</h2></div>
      <p>Wähle das Erscheinungsbild für deine App-Zentrale.</p>
      <div className="choice-row">
        <button className={'choice ' + (theme === 'dark' ? 'active' : '')} onClick={() => setTheme('dark')}>🌙 Dunkel</button>
        <button className={'choice ' + (theme === 'light' ? 'active' : '')} onClick={() => setTheme('light')}>☀️ Hell</button>
      </div>
    </section>
    <section className="panel">
      <div className="section-heading"><span className="section-kicker">DEINE DATEN</span><h2>Sichern und wiederherstellen</h2></div>
      <p>Notizen und Aufgaben liegen nur lokal im Browser dieses Geräts. Sichere sie regelmäßig, insbesondere vor einem Gerätewechsel.</p>
      <div className="action-row">
        <button className="button" onClick={exportData}>⬇ Backup exportieren</button>
        <label className="button outline import-label">⬆ Backup importieren<input type="file" accept="application/json,.json" onChange={importData} hidden /></label>
      </div>
      {message && <p className="setting-message" role="status">{message}</p>}
    </section>
    <section className="panel">
      <div className="section-heading"><span className="section-kicker">SYSTEM</span><h2>Über Hayko Webstore</h2></div>
      <dl className="details"><div><dt>Version</dt><dd>v{build.version}</dd></div><div><dt>Build</dt><dd>{build.build}</dd></div><div><dt>Commit</dt><dd>{build.commit}</dd></div></dl>
      <p>Installierbare Web-App · GitHub Pages · Aktualisierung über den Update-Button.</p>
    </section>
  </div>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [theme, setStoredTheme] = useStoredState<Theme>('theme', 'dark')
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState('')
  const [available, setAvailable] = useState<Version | null>(null)
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const currentApp = APPS.find(app => app.id === screen)
  const AppComponent = currentApp ? toolComponents[currentApp.id] : null

  async function checkUpdate() {
    if (needRefresh) {
      await updateServiceWorker(true)
      return
    }
    setChecking(true)
    setStatus('Neue Version wird geprüft …')
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'version.json?time=' + Date.now(), { cache: 'no-store' })
      if (!response.ok) throw new Error('Update-Server nicht erreichbar')
      const published = await response.json() as Version
      if (published.version !== build.version || published.build !== build.build || published.commit !== build.commit) {
        setAvailable(published)
        setStatus('Neue Version gefunden. Update wird vorbereitet …')
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
          await registration?.update()
          if (registration?.waiting) await updateServiceWorker(true)
        } else {
          window.location.reload()
        }
      } else {
        setAvailable(null)
        setStatus('Du hast bereits die aktuelle Version.')
      }
    } catch {
      setStatus('Update-Prüfung nicht möglich. Bitte Internetverbindung prüfen.')
    } finally {
      setChecking(false)
    }
  }

  function goHome() { setScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function open(next: Screen) { setScreen(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={goHome} aria-label="Hayko Webstore Startseite">
        <span className="brand-mark">H<span>.</span></span>
        <span className="brand-copy"><strong>HAYKO</strong><small>WEBSTORE</small></span>
      </button>
      <div className="top-actions">
        <span className="version-chip">v{build.version} <span className="version-separator">·</span> B{build.build}</span>
        <button className={'button update-button ' + (needRefresh ? 'has-update' : '')}
          onClick={checkUpdate} disabled={checking}>
          <span aria-hidden="true">{checking ? '◌' : '↻'}</span>
          <span>{checking ? 'Prüfe …' : needRefresh ? 'Update installieren' : 'Update'}</span>
        </button>
      </div>
    </header>

    <main className="main-content">
      {screen === 'home' ? <>
        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-content">
            <div className="eyebrow"><span className="live-dot" /> DEINE PERSÖNLICHE APP-PLATTFORM</div>
            <h1>Alles an einem <em>Ort.</em></h1>
            <p>Deine Apps, deine Ideen, dein Webstore. Starte direkt oder erweitere deine Sammlung.</p>
            <div className="hero-stats"><span>✦ {APPS.length} Apps bereit</span><span>◈ iPhone · Android · Desktop</span></div>
          </div>
          <div className="hero-art" aria-hidden="true"><span>H</span></div>
        </section>
        <div className="section-header">
          <div><span className="section-kicker">ENTDECKEN & STARTEN</span><h2>Deine Apps <span className="count">{APPS.length}</span></h2></div>
          <span className="muted-note">Alle Anwendungen</span>
        </div>
        <div className="apps-grid">
          {APPS.map(app => <button key={app.id} className={'app-card card-' + app.color} onClick={() => open(app.id)}>
            <div className="app-icon">{app.icon}</div>
            <div className="app-info"><h3>{app.name}</h3><p>{app.description}</p></div>
            <span className="card-arrow" aria-hidden="true">↗</span>
          </button>)}
          <div className="app-card coming-soon"><div className="app-icon plus-icon">+</div><div className="app-info"><h3>Platz für mehr</h3><p>Neue Apps lassen sich jederzeit ergänzen.</p></div></div>
        </div>
        <div className="tip"><span>💡</span><p><strong>Wie MeviCar Next – nur universell.</strong> Alle Apps teilen sich ein Design, dieselbe Startseite und eine gemeinsame Update-Funktion.</p></div>
      </> : screen === 'settings' ? <>
        <div className="page-heading"><div><span className="section-kicker">PERSONALISIEREN</span><h1>Einstellungen</h1></div><button className="text-button" onClick={goHome}>← Alle Apps</button></div>
        <Settings theme={theme} setTheme={setStoredTheme} />
      </> : currentApp && AppComponent ? <>
        <div className="page-heading"><div><span className="section-kicker">HAYKO APP</span><h1>{currentApp.icon} {currentApp.name}</h1></div><button className="text-button" onClick={goHome}>← Alle Apps</button></div>
        <AppComponent />
      </> : null}
      {status && <p className="update-status" role="status">{status}{available && !needRefresh ? ' (v' + available.version + ' · B' + available.build + ')' : ''}</p>}
      {needRefresh && <div className="refresh-prompt"><span>Eine neue Version ist bereit.</span><button className="button" onClick={() => void updateServiceWorker(true)}>Jetzt aktualisieren</button></div>}
    </main>

    <footer className="footer">
      <span>© {new Date().getFullYear()} Hayko Webstore</span>
      <span>Made for everyday ideas <span className="footer-sparkle">✦</span></span>
    </footer>

    <nav className="bottom-nav" aria-label="Hauptnavigation">
      <button className={screen === 'home' ? 'active' : ''} onClick={goHome}><span>▦</span> Apps</button>
      <button className={screen === 'settings' ? 'active' : ''} onClick={() => open('settings')}><span>⚙</span> Einstellungen</button>
    </nav>
  </div>
}
