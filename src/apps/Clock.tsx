import { useEffect, useState } from 'react'
import { useStoredState } from '../storage'

const dateFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function Clock() {
  const [now, setNow] = useState(() => new Date())
  const [use24h, setUse24h] = useStoredState<boolean>('clock24h', true)

  useEffect(() => {
    // Synchronize the display with the device clock, including after backgrounding.
    const tick = () => setNow(new Date())
    const timer = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const hours = now.getHours()
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()
  const time = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24h
  }).format(now)

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Gerätezeit'

  return <section className="tool clock-tool" aria-label="Uhr">
    <div className="clock-topline">
      <span className="clock-live"><span className="live-dot" /> LIVE · GERÄTEZEIT</span>
      <div className="clock-format" role="group" aria-label="Zeitformat">
        <button type="button" className={use24h ? 'active' : ''} aria-pressed={use24h} onClick={() => setUse24h(true)}>24 h</button>
        <button type="button" className={!use24h ? 'active' : ''} aria-pressed={!use24h} onClick={() => setUse24h(false)}>12 h</button>
      </div>
    </div>
    <div className="clock-content">
      <div className="clock-face" role="img" aria-label={`Analoguhr: ${time}`}>
        {Array.from({ length: 12 }, (_, index) => {
          const angle = index * 30 * Math.PI / 180
          return <span className="clock-number" key={index} style={{
            left: `${50 + 40 * Math.sin(angle)}%`,
            top: `${50 - 40 * Math.cos(angle)}%`
          }}>{index === 0 ? 12 : index}</span>
        })}
        {Array.from({ length: 60 }, (_, index) =>
          <span className={'clock-tick ' + (index % 5 === 0 ? 'major' : '')} key={'tick-' + index}
            style={{ transform: `rotate(${index * 6}deg)` }} />
        )}
        <span className="clock-hand clock-hour" style={{ transform: `translateX(-50%) rotate(${(hours % 12 + minutes / 60) * 30}deg)` }} />
        <span className="clock-hand clock-minute" style={{ transform: `translateX(-50%) rotate(${(minutes + seconds / 60) * 6}deg)` }} />
        <span className="clock-hand clock-second" style={{ transform: `translateX(-50%) rotate(${seconds * 6}deg)` }} />
        <span className="clock-center" />
      </div>
      <div className="clock-readout">
        <span className="clock-label">Aktuelle Uhrzeit</span>
        <div className="clock-digits" aria-live="off">{time}</div>
        <div className="clock-date">{dateFormatter.format(now)}</div>
        <div className="clock-zone">◷ {zone}</div>
        <p>Die Uhrzeit wird direkt von deinem Gerät übernommen und jede Sekunde aktualisiert.</p>
      </div>
    </div>
  </section>
}
