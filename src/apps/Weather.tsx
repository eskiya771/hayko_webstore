import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useStoredState } from '../storage'

type Place = {
  id: number
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
}

type Forecast = {
  timezone: string
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    precipitation: number
    weather_code: number
    is_day: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    weather_code: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
  }
}

const formatTemperature = (value: number) => Number.isFinite(value) ? Math.round(value) + '°' : '–'
const formatDate = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('de-DE', options).format(new Date(iso + 'T12:00:00'))

function weatherLabel(code: number): string {
  if (code === 0) return 'Klarer Himmel'
  if (code <= 2) return 'Heiter bis wolkig'
  if (code === 3) return 'Bedeckt'
  if (code === 45 || code === 48) return 'Nebel'
  if (code >= 51 && code <= 57) return 'Nieselregen'
  if (code >= 61 && code <= 67) return 'Regen'
  if (code >= 71 && code <= 77) return 'Schnee'
  if (code >= 80 && code <= 82) return 'Regenschauer'
  if (code >= 85 && code <= 86) return 'Schneeschauer'
  if (code >= 95) return 'Gewitter'
  return 'Wechselhaft'
}

function weatherIcon(code: number, day = true): string {
  if (code === 0) return day ? '☀️' : '🌙'
  if (code <= 2) return day ? '🌤️' : '☁️'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌥️'
}

function displayPlace(place: Place): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

function placeKey(place: Place): string {
  return String(place.id) + ':' + String(place.latitude) + ':' + String(place.longitude)
}

export default function Weather() {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<Place[]>([])
  const [selected, setSelected] = useStoredState<Place | null>('weather:lastPlace', null)
  const [recent, setRecent] = useStoredState<Place[]>('weather:recentPlaces', [])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [forecastError, setForecastError] = useState('')
  const searchController = useRef<AbortController | null>(null)

  useEffect(() => () => searchController.current?.abort(), [])

  useEffect(() => {
    if (!selected) {
      setForecast(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({
      latitude: String(selected.latitude),
      longitude: String(selected.longitude),
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day',
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '6'
    })

    setLoading(true)
    setForecast(null)
    setForecastError('')

    fetch('https://api.open-meteo.com/v1/forecast?' + params, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Wetterdienst nicht erreichbar')
        return response.json() as Promise<Forecast>
      })
      .then(data => {
        if (!data.current || !data.daily?.time?.length || !data.hourly?.time?.length) {
          throw new Error('Unvollständige Wetterdaten')
        }
        if (!controller.signal.aborted) setForecast(data)
      })
      .catch(error => {
        if (!controller.signal.aborted) setForecastError('Wetterdaten konnten nicht geladen werden. Bitte Verbindung prüfen und erneut versuchen.')
        console.warn('Hayko Wetter:', error)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [selected])

  async function findPlaces(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = query.trim()
    searchController.current?.abort()
    setMatches([])
    setSearchError('')
    if (term.length < 2) {
      setSearchError('Bitte mindestens zwei Zeichen für den Ort eingeben.')
      return
    }

    const controller = new AbortController()
    searchController.current = controller
    setSearching(true)

    try {
      const params = new URLSearchParams({ name: term, count: '10', language: 'de', format: 'json' })
      const response = await fetch('https://geocoding-api.open-meteo.com/v1/search?' + params, {
        signal: controller.signal
      })
      if (!response.ok) throw new Error('Ortssuche fehlgeschlagen')
      const result = await response.json() as { results?: Place[] }
      if (controller.signal.aborted) return
      const found = (result.results ?? []).filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      setMatches(found)
      if (!found.length) setSearchError('Kein passender Ort gefunden. Bitte Schreibweise prüfen.')
    } catch {
      if (!controller.signal.aborted) setSearchError('Ortssuche momentan nicht erreichbar. Bitte erneut versuchen.')
    } finally {
      if (!controller.signal.aborted) setSearching(false)
    }
  }

  function choose(place: Place) {
    searchController.current?.abort()
    setSearching(false)
    setSelected(place)
    setRecent(current => [place, ...current.filter(p => placeKey(p) !== placeKey(place))].slice(0, 6))
    setQuery('')
    setMatches([])
    setSearchError('')
    setForecastError('')
  }

  const hourly = forecast?.hourly
  const startIndex = forecast && hourly
    ? Math.max(0, hourly.time.findIndex(time => time.slice(0, 13) >= forecast.current.time.slice(0, 13)))
    : 0
  const hours = hourly?.time.slice(startIndex, startIndex + 10) ?? []

  return <section className="tool weather-tool" aria-label="Wetter">
    <div className="weather-search-head">
      <div>
        <span className="section-kicker">WETTER IN DEINER STADT</span>
        <h2>Wo möchtest du das Wetter sehen?</h2>
      </div>
      <span className="weather-provider">Daten: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span>
    </div>

    <form className="weather-search-form" onSubmit={findPlaces}>
      <label htmlFor="weather-city" className="visually-hidden">Ort oder Stadt suchen</label>
      <input id="weather-city" type="search" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)}
        placeholder="Ort eingeben, z. B. München, Erlangen, Antalya" />
      <button className="button" type="submit" disabled={searching}>{searching ? 'Suche …' : 'Ort suchen'}</button>
    </form>

    {searchError && <p className="weather-message" role="status">{searchError}</p>}
    {matches.length > 0 && <div className="weather-results">
      <div className="weather-subtitle">Ort auswählen</div>
      {matches.map(place =>
        <button type="button" key={placeKey(place)} className="weather-place-option" onClick={() => choose(place)}>
          <span>📍 {place.name}<small>{[place.admin1, place.country].filter(Boolean).join(' · ')}</small></span>
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>}

    {recent.length > 0 && <div className="weather-recent">
      <span className="weather-subtitle">Zuletzt verwendete Orte</span>
      <div className="weather-recent-list">
        {recent.map(place => <button type="button" key={placeKey(place)} className={'weather-city-chip ' + (selected && placeKey(selected) === placeKey(place) ? 'active' : '')} onClick={() => choose(place)}>
          📍 {place.name}
        </button>)}
      </div>
    </div>}

    {!selected && <div className="weather-empty">
      <div aria-hidden="true">🌤️</div>
      <h3>Dein Wetter auf einen Blick</h3>
      <p>Suche nach einer Stadt oder einem Ort. Anschließend siehst du das aktuelle Wetter und die Vorhersage.</p>
    </div>}

    {selected && <>
      <div className="weather-location-title">
        <div><span className="weather-subtitle">AUSGEWÄHLTER ORT</span><h2>📍 {displayPlace(selected)}</h2></div>
        <button type="button" className="weather-reload" onClick={() => setSelected({ ...selected })} disabled={loading} aria-label="Wetter neu laden">↻ Aktualisieren</button>
      </div>

      {loading && <p className="weather-message" role="status">Wetterdaten für {selected.name} werden geladen …</p>}
      {forecastError && <p className="weather-message weather-error" role="alert">{forecastError}</p>}

      {forecast && <>
        <div className="weather-current">
          <div className="weather-main-info">
            <span className="weather-condition-icon" role="img" aria-label={weatherLabel(forecast.current.weather_code)}>
              {weatherIcon(forecast.current.weather_code, forecast.current.is_day === 1)}
            </span>
            <div>
              <div className="weather-temperature">{formatTemperature(forecast.current.temperature_2m)}</div>
              <div className="weather-description">{weatherLabel(forecast.current.weather_code)}</div>
              <div className="weather-feels">Gefühlt {formatTemperature(forecast.current.apparent_temperature)}</div>
            </div>
          </div>
          <div className="weather-metrics">
            <div><span>💧 Luftfeuchtigkeit</span><strong>{Math.round(forecast.current.relative_humidity_2m)} %</strong></div>
            <div><span>💨 Wind</span><strong>{Math.round(forecast.current.wind_speed_10m)} km/h</strong></div>
            <div><span>☔ Niederschlag</span><strong>{forecast.current.precipitation.toLocaleString('de-DE')} mm</strong></div>
            <div><span>🌡️ Heute</span><strong>{formatTemperature(forecast.daily.temperature_2m_max[0])} / {formatTemperature(forecast.daily.temperature_2m_min[0])}</strong></div>
          </div>
        </div>

        <div className="weather-section-title"><h3>Die nächsten Stunden</h3><span>Temperatur und Regenwahrscheinlichkeit</span></div>
        <div className="weather-hourly">
          {hours.map((time, index) => {
            const i = startIndex + index
            return <div className="weather-hour" key={time}>
              <span>{time.slice(11, 16)}</span>
              <span className="weather-hour-icon">{weatherIcon(hourly!.weather_code[i], true)}</span>
              <strong>{formatTemperature(hourly!.temperature_2m[i])}</strong>
              <small>💧 {hourly!.precipitation_probability[i] ?? 0}%</small>
            </div>
          })}
        </div>

        <div className="weather-section-title"><h3>5-Tage-Vorhersage</h3><span>Höchst- und Tiefstwerte</span></div>
        <div className="weather-daily">
          {forecast.daily.time.slice(0, 5).map((day, index) =>
            <div className="weather-day" key={day}>
              <span className="weather-day-name">{index === 0 ? 'Heute' : formatDate(day, { weekday: 'short' })}</span>
              <span className="weather-day-condition"><span>{weatherIcon(forecast.daily.weather_code[index])}</span> {weatherLabel(forecast.daily.weather_code[index])}</span>
              <span className="weather-day-rain">💧 {forecast.daily.precipitation_probability_max[index] ?? 0}%</span>
              <strong>{formatTemperature(forecast.daily.temperature_2m_max[index])} <span>/ {formatTemperature(forecast.daily.temperature_2m_min[index])}</span></strong>
            </div>
          )}
        </div>
        <p className="weather-footnote">Vorhersage für die Zeitzone {forecast.timezone}. Wetterdaten und Prognosen können sich ändern.</p>
      </>}
    </>}
  </section>
}
