# Hayko Webstore

Eine modulare, mobiloptimierte **Progressive Web App (PWA)** mit zentraler App-Startseite, Update-Button und automatischer Veröffentlichung über GitHub Actions und GitHub Pages. Optimiert für iPhone, Android und Desktop.

## Enthalten

- Professionelle App-Auswahl mit zentralem Design, Home und Einstellungen
- Fünf funktionsfähige Apps: **Rechner**, **Notizen**, **Aufgaben**, **Uhr**, **Wetter**
- Lokale Speicherung (Browser-LocalStorage) für Notizen, Aufgaben und Theme
- Datenexport und -import als JSON
- Hell-/Dunkelmodus, iPhone-Safe-Areas, Home-Bildschirm-Installation
- PWA mit Service Worker und manueller Update-Prüfung
- Automatische Versionsanzeige (`v0.1.0 · B<GitHub Run Number>`)
- GitHub Actions für Build und GitHub Pages

## Erstes Setup

1. Repository: <https://github.com/eskiya771/hayko_webstore>
2. Unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** auswählen.
3. Anschließend in **Actions** den Workflow **Build and deploy Hayko Webstore** manuell ausführen oder einen neuen Commit auf `main` pushen.
4. Nach erfolgreichem Deployment: <https://eskiya771.github.io/hayko_webstore/>
5. Auf dem iPhone in **Safari** öffnen → **Teilen** → **Zum Home-Bildschirm**.

> Die URL ist erst nach erfolgreicher Aktivierung von GitHub Pages und dem ersten Deployment erreichbar. Ein ausgeschöpftes oder blockiertes GitHub-Actions-Kontingent kann das Deployment verhindern.

## Lokal entwickeln

Voraussetzung: Node.js 22 (oder kompatible LTS-Version), Git und VS Code.

```bash
git clone https://github.com/eskiya771/hayko_webstore.git
cd hayko_webstore
npm install
npm run dev
```

`npm run build` führt die TypeScript-Prüfung durch und erzeugt das veröffentlichbare Verzeichnis `dist/`.

## Neue Apps hinzufügen

1. React-Komponente unter `src/apps/MeineApp.tsx` anlegen.
2. Neue App in `src/apps/registry.ts` eintragen.
3. Komponente in der `toolComponents`-Zuordnung in `src/App.tsx` registrieren.
4. Commit und Push auf `main` veröffentlichen die Änderung automatisch (bei aktiviertem GitHub Pages).

Alle Apps nutzen die zentrale Navigation, Einstellungen und Update-Funktion. Das ist **ein gemeinsames Web-App-Projekt**, kein Sammelsurium voneinander unabhängiger Deployments. Externe App-Links können später als weiteres Registry-Element eingeführt werden.

## Versions- und Update-Verhalten

Das Skript `scripts/write-version.mjs` erzeugt bei jedem Build `src/generated/build.json` (in der App angezeigt) und `public/version.json` (für Update-Prüfung). Der Update-Button lädt `version.json` ohne HTTP-Cache, vergleicht Version, Build und Commit und fordert den PWA-Service-Worker zur Update-Prüfung auf. Sobald ein neuer Worker zur Aktivierung bereitsteht, wird eine **Jetzt aktualisieren**-Aktion angeboten. Ein Reload vor Fertigstellung des Downloads wird vermieden.

Für den produktiven Betrieb sollte die Versions-JSON nicht durch einen vorgeschalteten CDN-Cache zurückgehalten werden; der Button verwendet dafür einen Zeitparameter und `cache: no-store`.

## Sicherheit und Grenzen

- Das Repository ist **öffentlich**. Niemals vertraulichen Code, Kundendaten, API-Schlüssel, Zugangstokens oder Secrets committen.
- Die Starter-Apps speichern Daten **nur auf dem jeweiligen Gerät**, es findet keine automatische Synchronisierung zwischen Geräten statt.
- GitHub Pages stellt **statische Dateien** bereit, kein geschütztes Backend. Für private Daten, Serverfunktionen und Benutzerkonten ist eine gesonderte Architektur erforderlich.
- SVG-Icon ist eine erste Basis. Für optimale iPhone-Home-Bildschirm-Darstellung später ein eigenes PNG-`apple-touch-icon` ergänzen.
- Verwendete Open-Source-Pakete und GitHub-Actions-Versionen regelmäßig aktualisieren.

## Entwicklung mit Codex

Arbeite möglichst auf Feature-Branches, teste lokal (`npm run build`) und merge geprüfte Pull Requests nach `main`. Gemeinsame Funktionen (Update, Navigation, Datenspeicherung) gehören in das App-Grundgerüst, nicht als Kopien in einzelne Apps.

## Wetter-App (v0.3.0)

Ort suchen, aus den Treffern auswählen und aktuelle Wetterdaten mit stündlicher sowie 5-Tage-Vorhersage anzeigen. Die letzten sechs gewählten Orte werden lokal gespeichert und sind direkt wieder aufrufbar. Die App fragt [Open-Meteo](https://open-meteo.com/) (Geocoding und Forecast) über HTTPS ohne eigenen API-Key ab. Eine Internetverbindung ist nötig. Die Nutzung der freien API muss zu deren Nutzungsbedingungen passen.
