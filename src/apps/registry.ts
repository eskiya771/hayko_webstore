export const APPS = [
  {
    id: 'calculator',
    name: 'Rechner',
    description: 'Schnell und einfach rechnen.',
    icon: '🧮',
    color: 'cyan'
  },
  {
    id: 'notes',
    name: 'Notizen',
    description: 'Ideen und Gedanken festhalten.',
    icon: '📝',
    color: 'violet'
  },
  {
    id: 'tasks',
    name: 'Aufgaben',
    description: 'Den Überblick behalten.',
    icon: '✅',
    color: 'amber'
  },
  {
    id: 'clock',
    name: 'Uhr',
    description: 'Analoguhr, Digitaluhr und Datum.',
    icon: '🕒',
    color: 'blue'
  },
  {
    id: 'weather',
    name: 'Wetter',
    description: 'Wetter für deine Wunschorte.',
    icon: '🌤️',
    color: 'cyan'
  }
] as const

export type AppId = typeof APPS[number]['id']
