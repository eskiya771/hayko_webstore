import { useState } from 'react'
import { useStoredState } from '../storage'

type Note = { id: string; title: string; body: string; updated: number }
const starter: Note[] = [{ id: 'welcome', title: 'Willkommen', body: 'Hier kannst du deine eigenen Notizen festhalten. Sie werden lokal auf diesem Gerät gespeichert.', updated: 0 }]

export default function Notes() {
  const [notes, setNotes] = useStoredState<Note[]>('notes', starter)
  const [selected, setSelected] = useState('welcome')
  const current = notes.find(note => note.id === selected) ?? notes[0]

  function createNote() {
    const note = { id: String(Date.now()) + Math.random().toString(36).slice(2), title: 'Neue Notiz', body: '', updated: Date.now() }
    setNotes(list => [note, ...list])
    setSelected(note.id)
  }
  function edit(patch: Partial<Note>) {
    if (!current) return
    setNotes(list => list.map(n => n.id === current.id ? { ...n, ...patch, updated: Date.now() } : n))
  }
  function remove() {
    if (!current || !window.confirm('Diese Notiz löschen?')) return
    setNotes(list => list.filter(n => n.id !== current.id))
    setSelected('')
  }

  return <section className="tool notes-tool">
    <div className="tool-toolbar"><span>{notes.length} Notizen · Nur auf diesem Gerät</span><button className="button small" onClick={createNote}>+ Neue Notiz</button></div>
    {notes.length === 0 ? <div className="empty-state">Noch keine Notizen. Erstelle deine erste Notiz.</div> :
      <div className="notes-layout">
        <div className="note-list">{notes.map(n => <button key={n.id} className={'note-link ' + (current?.id === n.id ? 'selected' : '')} onClick={() => setSelected(n.id)}>
          <strong>{n.title || 'Ohne Titel'}</strong><span>{n.body.slice(0, 48) || 'Leere Notiz'}</span>
        </button>)}</div>
        <div className="note-editor">
          <input aria-label="Titel" value={current?.title ?? ''} onChange={e => edit({ title: e.target.value })} placeholder="Titel" />
          <textarea aria-label="Notizinhalt" value={current?.body ?? ''} onChange={e => edit({ body: e.target.value })} placeholder="Hier schreiben …" />
          <button className="text-button danger" onClick={remove}>Notiz löschen</button>
        </div>
      </div>}
  </section>
}
