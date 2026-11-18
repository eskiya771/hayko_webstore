import { useState, type FormEvent } from 'react'
import { useStoredState } from '../storage'

type Task = { id: string; title: string; done: boolean }

export default function Tasks() {
  const [tasks, setTasks] = useStoredState<Task[]>('tasks', [])
  const [input, setInput] = useState('')
  const done = tasks.filter(task => task.done).length

  function add(event: FormEvent) {
    event.preventDefault()
    if (!input.trim()) return
    setTasks(current => [{ id: String(Date.now()) + Math.random().toString(36).slice(2), title: input.trim(), done: false }, ...current])
    setInput('')
  }

  return <section className="tool tasks-tool">
    <div className="tool-toolbar"><span>{done} von {tasks.length} erledigt</span></div>
    <form className="task-form" onSubmit={add}>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Was steht an?" aria-label="Neue Aufgabe" maxLength={200} />
      <button className="button" type="submit">Hinzufügen</button>
    </form>
    {tasks.length === 0 ? <div className="empty-state">Deine Aufgabenliste ist noch leer.</div> :
      <div className="task-list">{tasks.map(task => <div className="task-row" key={task.id}>
        <label><input type="checkbox" checked={task.done} onChange={() => setTasks(list => list.map(t => t.id === task.id ? { ...t, done: !t.done } : t))} /><span className={task.done ? 'done' : ''}>{task.title}</span></label>
        <button className="icon-button" aria-label={'Aufgabe ' + task.title + ' löschen'} onClick={() => setTasks(list => list.filter(t => t.id !== task.id))}>×</button>
      </div>)}</div>}
  </section>
}
