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
  }
] as const

export type AppId = typeof APPS[number]['id']
